from contextlib import asynccontextmanager
from fastapi import FastAPI

from ops_pilot.database import Base, engine
from ops_pilot.models import auth_model, environment_model, project_model, service_model
from ops_pilot.routers.auth_router import router as auth_router
from ops_pilot.routers.environment_router import router as environment_router
from ops_pilot.routers.projects_router import router as project_router
from ops_pilot.routers.services_router import router as services_router
from ops_pilot.routers.deployment_router import router as deployment_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code here
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown code here

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.include_router(project_router)
app.include_router(services_router)
app.include_router(environment_router)
app.include_router(deployment_router)