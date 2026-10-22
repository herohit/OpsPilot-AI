import unittest
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete, insert
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from ops_pilot.database import Base, get_db
from ops_pilot.models.auth_model import UserModel
from ops_pilot.models import deployment_model  # Register the environment relationship.
from ops_pilot.models.environment_model import Environment
from ops_pilot.models.log_model import Log
from ops_pilot.models.project_model import Project
from ops_pilot.models.service_model import Service
from ops_pilot.routers.log_router import logs_router
from ops_pilot.services.auth_service import get_current_user
from ops_pilot.services.log_service import list_logs


class LogHistoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(cls.engine)
        cls.owner_id = uuid4()
        cls.other_owner_id = uuid4()
        cls.environment_ids = [uuid4() for _ in range(3)]
        cls.service_ids = [uuid4() for _ in range(3)]
        cls.now = datetime.now(timezone.utc)
        with Session(cls.engine) as db:
            for index, owner_id in enumerate([cls.owner_id, cls.other_owner_id]):
                db.add(UserModel(
                    id=owner_id, email=f"user{index}@example.com",
                    hashed_password="unused", first_name="Test", last_name="User",
                ))
            for index in range(3):
                project_id = uuid4()
                db.add(Project(
                    id=project_id, name=f"Project {index}",
                    owner_id=cls.other_owner_id if index == 2 else cls.owner_id,
                ))
                db.add(Service(id=cls.service_ids[index], project_id=project_id, name=f"Service {index}"))
                db.add(Environment(
                    id=cls.environment_ids[index], project_id=project_id,
                    service_id=cls.service_ids[index], name=f"Environment {index}",
                ))
            db.flush()
            db.execute(insert(Log), [
                {
                    "id": UUID(int=index),
                    "environment_id": cls.environment_ids[0],
                    "payload": {"severity": "warning", "msg": f"Record {index}", "extra": {"index": index}},
                    "received_at": cls.now if index == 5006 else cls.now - timedelta(days=30),
                }
                for index in range(1, 5007)
            ])
            db.add_all([
                Log(environment_id=cls.environment_ids[1], payload={"message": "Second service"}),
                Log(environment_id=cls.environment_ids[1], payload={"event": "Fallback payload"}),
                Log(environment_id=cls.environment_ids[2], payload={"message": "Private other owner"}),
            ])
            db.commit()

        cls.app = FastAPI()
        cls.app.include_router(logs_router)

        def override_db():
            with Session(cls.engine) as db:
                yield db

        def override_user():
            return UserModel(id=cls.owner_id)

        cls.app.dependency_overrides[get_db] = override_db
        cls.app.dependency_overrides[get_current_user] = override_user
        cls.client = TestClient(cls.app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        cls.engine.dispose()

    def history(self, **params):
        response = self.client.get("/logs/history", params=params)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_defaults_and_response_shape(self):
        data = self.history()
        self.assertEqual(set(data), {"items", "total", "page", "page_size", "total_pages"})
        self.assertEqual((data["total"], data["page"], data["page_size"], data["total_pages"]), (5008, 1, 50, 101))
        self.assertEqual(len(data["items"]), 50)
        self.assertNotIn("Private other owner", [item["message"] for item in data["items"]])
        record = next(item for item in data["items"] if item["id"] == str(UUID(int=5006)))
        self.assertEqual(record["level"], "WARNING")
        self.assertEqual(record["message"], "Record 5006")
        self.assertEqual(record["payload"]["extra"], {"index": 5006})
        self.assertEqual(record["service_name"], "Service 0")

    def test_stable_order_and_disjoint_pages(self):
        params = {"service_id": str(self.service_ids[0]), "page_size": 25}
        first = self.history(**params, page=1)
        second = self.history(**params, page=2)
        first_ids = [item["id"] for item in first["items"]]
        self.assertEqual(first_ids, [str(UUID(int=index)) for index in range(5006, 4981, -1)])
        self.assertTrue(set(first_ids).isdisjoint(item["id"] for item in second["items"]))
        self.assertEqual(first, self.history(**params, page=1))

    def test_history_includes_old_records_beyond_live_cutoff(self):
        data = self.history(page=51, page_size=100)
        self.assertEqual(data["total"], 5008)
        self.assertEqual(data["total_pages"], 51)
        self.assertEqual(len(data["items"]), 8)
        self.assertEqual(data["items"][-1]["id"], str(UUID(int=1)))

    def test_filters_and_owner_isolation(self):
        data = self.history(environment_id=str(self.environment_ids[1]))
        self.assertEqual(data["total"], 2)
        self.assertTrue(all(item["environment_id"] == str(self.environment_ids[1]) for item in data["items"]))
        for params in [
            {"environment_id": str(self.environment_ids[2])},
            {"service_id": str(self.service_ids[2])},
            {"service_id": str(self.service_ids[0]), "environment_id": str(self.environment_ids[1])},
            {"service_id": str(uuid4())},
        ]:
            with self.subTest(params=params):
                empty = self.history(**params)
                self.assertEqual((empty["items"], empty["total"], empty["total_pages"]), ([], 0, 0))

    def test_out_of_range_page(self):
        data = self.history(page=10000)
        self.assertEqual(data["items"], [])
        self.assertEqual(data["total"], 5008)
        self.assertEqual(data["page"], 10000)

    def test_invalid_pagination_and_uuid_are_rejected(self):
        for params in [
            {"page": 0}, {"page": -1}, {"page": "invalid"},
            {"page_size": 0}, {"page_size": 101}, {"service_id": "invalid"},
        ]:
            with self.subTest(params=params):
                self.assertEqual(self.client.get("/logs/history", params=params).status_code, 422)

    def test_existing_live_snapshot_is_unchanged(self):
        with Session(self.engine) as db:
            entries = list_logs(db, self.owner_id, self.service_ids[0], None, "WARNING", "record", 1, 500)
            self.assertEqual(len(entries), 1)
            self.assertEqual(entries[0]["message"], "Record 5006")
            self.assertEqual(entries[0]["level"], "WARNING")
        response = self.client.get("/logs", params={"service_id": str(self.service_ids[0])})
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        self.assertEqual(len(response.json()), 1)

    def add_logs(self, payloads):
        ids = [uuid4() for _ in payloads]
        with Session(self.engine) as db:
            db.execute(insert(Log), [
                {
                    "id": log_id,
                    "environment_id": self.environment_ids[1],
                    "received_at": self.now,
                    "payload": payload,
                }
                for log_id, payload in zip(ids, payloads)
            ])
            db.commit()

        def cleanup():
            with Session(self.engine) as db:
                db.execute(delete(Log).where(Log.id.in_(ids)))
                db.commit()

        self.addCleanup(cleanup)
        return [str(log_id) for log_id in ids]

    def test_searches_all_history_before_paginating(self):
        data = self.history(search="rEcOrD 1", page_size=10, page=2)
        self.assertEqual(data["total"], 1111)
        self.assertEqual(data["total_pages"], 112)
        self.assertEqual(len(data["items"]), 10)
        self.assertTrue(all("Record 1" in item["message"] for item in data["items"]))
        oldest = self.history(search="Record 1", sort="asc", page_size=1)
        self.assertEqual(oldest["items"][0]["id"], str(UUID(int=1)))
        self.assertEqual(self.history(search="no-such-message")["total"], 0)
        self.assertEqual(self.history(search="  ")["total"], 5008)

    def test_searches_nested_context_and_escapes_sql_wildcards(self):
        ids = self.add_logs([
            {"message": "fixture", "context": {"request_id": "Trace-X7"}},
            {"message": "fixture contains 100%_literal"},
            {"message": "fixture contains 100XXliteral"},
        ])
        self.assertEqual(self.history(search="trace-x7")["items"][0]["id"], ids[0])
        data = self.history(search="100%_literal")
        self.assertEqual([item["id"] for item in data["items"]], [ids[1]])
        self.assertEqual(self.history(search="Private other owner")["total"], 0)

    def test_severity_fallbacks_aliases_and_case(self):
        ids = self.add_logs([
            {"message": "fixture", "level": "error"},
            {"message": "fixture", "severity": "ERROR"},
            {"message": "fixture", "level": "WARN"},
            {"message": "fixture", "severity": "warning"},
            {"message": "fixture"},
            {"message": "fixture", "level": "INFO", "severity": "ERROR"},
        ])
        error = self.history(search="fixture", level="error")
        self.assertEqual({item["id"] for item in error["items"]}, set(ids[:2]))
        for level in ("WARN", "WARNING"):
            self.assertEqual(
                {item["id"] for item in self.history(search="fixture", level=level)["items"]},
                set(ids[2:4]),
            )
        info = self.history(search="fixture", level="INFO")
        self.assertEqual({item["id"] for item in info["items"]}, set(ids[4:]))

    def test_date_boundaries_offsets_and_combined_filters(self):
        params = {
            "service_id": str(self.service_ids[0]),
            "environment_id": str(self.environment_ids[0]),
            "level": "warning", "search": "record",
            "start_time": self.now.isoformat(), "end_time": self.now.isoformat(),
        }
        data = self.history(**params)
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["items"][0]["id"], str(UUID(int=5006)))
        self.assertIsNotNone(datetime.fromisoformat(data["items"][0]["received_at"]).tzinfo)
        offset_time = self.now.astimezone(timezone(timedelta(hours=5, minutes=30)))
        self.assertEqual(self.history(**{**params, "start_time": offset_time.isoformat()})["total"], 1)
        old_time = (self.now - timedelta(days=30)).isoformat()
        old = self.history(**{**params, "start_time": old_time, "end_time": old_time}, page_size=100)
        self.assertEqual(old["total"], 5005)
        self.assertEqual(old["total_pages"], 51)
        self.assertEqual(self.history(service_id=str(self.service_ids[0]), end_time=old_time)["total"], 5005)
        self.assertEqual(self.history(service_id=str(self.service_ids[0]), start_time=(self.now + timedelta(days=1)).isoformat())["total"], 0)
        self.assertEqual(self.history(**{**params, "service_id": str(self.service_ids[2])})["total"], 0)

    def test_ascending_timestamp_sort_has_stable_disjoint_pages(self):
        params = {"service_id": str(self.service_ids[0]), "sort": "asc", "page_size": 25}
        first = self.history(**params, page=1)
        second = self.history(**params, page=2)
        self.assertEqual([item["id"] for item in first["items"]], [str(UUID(int=index)) for index in range(1, 26)])
        self.assertEqual([item["id"] for item in second["items"]], [str(UUID(int=index)) for index in range(26, 51)])
        last = self.history(**params, page=201)
        self.assertEqual(last["items"][-1]["id"], str(UUID(int=5006)))

    def test_invalid_history_filters_return_422(self):
        for params in [
            {"sort": "invalid"}, {"level": "invalid"}, {"search": "x" * 501},
            {"start_time": "invalid"}, {"end_time": "2026-10-22T10:00:00"},
            {"start_time": (self.now + timedelta(days=1)).isoformat(), "end_time": self.now.isoformat()},
        ]:
            with self.subTest(params=params):
                self.assertEqual(self.client.get("/logs/history", params=params).status_code, 422)


if __name__ == "__main__":
    unittest.main()
