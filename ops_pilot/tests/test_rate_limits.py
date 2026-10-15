import inspect
import unittest
from unittest.mock import patch
from uuid import uuid4

from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from ops_pilot.core.rate_limiter import limiter
from ops_pilot.database import get_db
from ops_pilot.main import (
    app,
    auth_router,
    deployment_router,
    environment_router,
    log_router,
    logs_router,
    project_router,
    services_router,
    user_deployments_router,
    user_environments_router,
    user_services_router,
)
from ops_pilot.models.auth_model import UserModel
from ops_pilot.services.auth_service import get_current_user


class RateLimitTests(unittest.TestCase):
    def setUp(self):
        limiter.reset()
        self.previous_overrides = app.dependency_overrides.copy()
        self.user = UserModel(
            id=uuid4(), email="test@example.com", first_name="Test",
            last_name="User", is_active=True, is_verified=False,
        )
        app.dependency_overrides[get_current_user] = lambda: self.user
        app.dependency_overrides[get_db] = lambda: None
        # Do not run lifespan: these tests must not start ingestion or touch the database.
        self.client = TestClient(app)
        self.project = f"/projects/{uuid4()}"
        self.service = f"{self.project}/services/{uuid4()}"
        self.environment = f"{self.service}/environments/{uuid4()}"

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        app.dependency_overrides.update(self.previous_overrides)
        limiter.reset()

    def test_every_limited_operation_allows_five_then_returns_429(self):
        cases = [
            ("POST", "/login", "auth_service.login", None),
            ("POST", "/register", "auth_service.register", {
                "email": "test@example.com", "password": "test-password",
                "first_name": "Test", "last_name": "User",
            }),
            ("PATCH", "/users/me", "auth_service.update_user", {"first_name": "Updated"}),
            ("POST", "/projects", "project_service.create_project", {"name": "Test"}),
            ("PATCH", self.project, "project_service.update_project", {"name": "Updated"}),
            ("DELETE", self.project, "project_service.delete_project", None),
            ("POST", f"{self.project}/services", "service_service.create_service", {"name": "Test"}),
            ("PATCH", self.service, "service_service.update_service", {"name": "Updated"}),
            ("DELETE", self.service, "service_service.delete_service", None),
            ("POST", f"{self.service}/environments", "environment_service.create_environment", {"name": "Test"}),
            ("PATCH", self.environment, "environment_service.update_environment", {"name": "Updated"}),
            ("DELETE", self.environment, "environment_service.delete_environment", None),
            ("POST", f"{self.environment}/deployments", "deployment_service.create_deployment", {
                "version": "1.0", "commit_sha": "abc123",
            }),
            ("PATCH", f"{self.environment}/deployments/{uuid4()}", "deployment_service.update_deployment", {
                "status": "success",
            }),
            ("POST", f"{self.environment}/log-sources", "log_service.create_log_source", {
                "stream_url": "http://localhost:8080/logs/stream",
            }),
            ("PUT", f"{self.environment}/log-sources/{uuid4()}", "log_service.update_log_source", {
                "stream_url": "http://localhost:8080/logs/stream",
            }),
            ("DELETE", f"{self.environment}/log-sources/{uuid4()}", "log_service.delete_log_source", None),
        ]
        for method, url, target, payload in cases:
            with self.subTest(method=method, url=url):
                limiter.reset()
                with patch(
                    f"ops_pilot.services.{target}",
                    return_value=JSONResponse({"ok": True}),
                ) as service:
                    kwargs = {"json": payload} if payload is not None else {}
                    if url == "/login":
                        kwargs = {"data": {"username": "test@example.com", "password": "test-password"}}
                    for _ in range(5):
                        response = self.client.request(method, url, **kwargs)
                        self.assertEqual(response.status_code, 200, response.text)
                    blocked = self.client.request(method, url, **kwargs)
                    self.assertEqual(blocked.status_code, 429, blocked.text)
                    self.assertEqual(service.call_count, 5)
                    body = blocked.json()
                    self.assertFalse(body["success"])
                    retry_after = int(blocked.headers["Retry-After"])
                    self.assertGreaterEqual(retry_after, 1)
                    self.assertLessEqual(retry_after, 60)
                    self.assertEqual(body["error"]["retry_after_seconds"], retry_after)

    def test_get_routes_and_session_endpoints_have_no_limit_decorator(self):
        checked = set()
        routers = (
            auth_router, deployment_router, environment_router, log_router,
            logs_router, project_router, services_router, user_deployments_router,
            user_environments_router, user_services_router,
        )
        for router in routers:
            for route in router.routes:
                if not isinstance(route, APIRoute):
                    continue
                if "GET" in (route.methods or set()) or route.path in {"/auth/refresh", "/auth/logout"}:
                    with self.subTest(path=route.path):
                        self.assertIs(inspect.unwrap(route.endpoint), route.endpoint)
                        checked.add(route.path)
        self.assertTrue({"/logs/stream", "/logs/history", "/users/me", "/auth/refresh", "/auth/logout"} <= checked)

    def test_frequent_reads_and_session_operations_allow_more_than_five_requests(self):
        cases = [
            ("GET", "/users/me", None, None),
            ("GET", "/projects", "project_service.get_projects", None),
            ("GET", "/logs", "log_service.list_logs", None),
            ("GET", "/logs/history", "log_service.list_log_history", None),
            ("POST", "/auth/refresh", "auth_service.refresh", None),
            ("POST", "/auth/logout", "auth_service.logout", {"refresh_token": "test-token"}),
        ]
        for method, url, target, payload in cases:
            with self.subTest(method=method, url=url):
                if target is None:
                    for _ in range(7):
                        response = self.client.get(url)
                        self.assertEqual(response.status_code, 200, response.text)
                    continue
                with patch(
                    f"ops_pilot.services.{target}",
                    return_value=JSONResponse({"ok": True}),
                ) as service:
                    for _ in range(7):
                        response = self.client.request(method, url, json=payload)
                        self.assertEqual(response.status_code, 200, response.text)
                    self.assertEqual(service.call_count, 7)

    def test_different_operations_do_not_share_the_same_budget(self):
        with (
            patch("ops_pilot.services.project_service.create_project", return_value=JSONResponse({"ok": True})),
            patch("ops_pilot.services.service_service.create_service", return_value=JSONResponse({"ok": True})),
        ):
            for _ in range(5):
                self.assertEqual(self.client.post("/projects", json={"name": "Test"}).status_code, 200)
            self.assertEqual(self.client.post("/projects", json={"name": "Test"}).status_code, 429)
            response = self.client.post(f"{self.project}/services", json={"name": "Test"})
            self.assertEqual(response.status_code, 200, response.text)

    def test_different_client_ips_have_separate_allowances(self):
        with patch(
            "ops_pilot.services.project_service.create_project",
            return_value=JSONResponse({"ok": True}),
        ):
            for _ in range(5):
                self.assertEqual(self.client.post("/projects", json={"name": "Test"}).status_code, 200)
            self.assertEqual(self.client.post("/projects", json={"name": "Test"}).status_code, 429)
            other_client = TestClient(app, client=("198.51.100.2", 50000))
            try:
                response = other_client.post("/projects", json={"name": "Test"})
                self.assertEqual(response.status_code, 200, response.text)
            finally:
                other_client.close()


if __name__ == "__main__":
    unittest.main()
