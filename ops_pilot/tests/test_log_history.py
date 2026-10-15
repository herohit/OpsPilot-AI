import unittest
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, insert
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


if __name__ == "__main__":
    unittest.main()
