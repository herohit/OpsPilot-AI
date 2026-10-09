from contextlib import asynccontextmanager
from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from ops_pilot.database import Base, engine
from ops_pilot.models import auth_model, environment_model, project_model, service_model
from ops_pilot.models import log_model
from ops_pilot.routers.auth_router import router as auth_router
from ops_pilot.routers.environment_router import router as environment_router
from ops_pilot.routers.environment_router import user_environments_router
from ops_pilot.routers.projects_router import router as project_router
from ops_pilot.routers.services_router import router as services_router
from ops_pilot.routers.services_router import user_services_router
from ops_pilot.routers.deployment_router import router as deployment_router
from ops_pilot.routers.deployment_router import user_deployments_router
from ops_pilot.routers.log_router import router as log_router
from ops_pilot.consumers.log_consumer import LogConsumeManager

log_consumer = LogConsumeManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code here
    Base.metadata.create_all(bind=engine)
    await log_consumer.start()
    yield
    # Shutdown code here
    await log_consumer.stop()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(project_router)
app.include_router(services_router)
app.include_router(user_services_router)
app.include_router(environment_router)
app.include_router(user_environments_router)
app.include_router(deployment_router)
app.include_router(user_deployments_router)
app.include_router(log_router)