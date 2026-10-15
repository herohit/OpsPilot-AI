from math import ceil

from contextlib import asynccontextmanager
import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from slowapi.errors import RateLimitExceeded

from fastapi.middleware.cors import CORSMiddleware

from ops_pilot.database import Base, engine
from ops_pilot.routers.auth_router import router as auth_router
from ops_pilot.routers.environment_router import router as environment_router
from ops_pilot.routers.environment_router import user_environments_router
from ops_pilot.routers.projects_router import router as project_router
from ops_pilot.routers.services_router import router as services_router
from ops_pilot.routers.services_router import user_services_router
from ops_pilot.routers.deployment_router import router as deployment_router
from ops_pilot.routers.deployment_router import user_deployments_router
from ops_pilot.routers.log_router import router as log_router, logs_router
from ops_pilot.consumers.log_consumer import LogConsumeManager
from ops_pilot.core.rate_limiter import limiter


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

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(
    request: Request,
    exc: RateLimitExceeded,
) -> JSONResponse:
    retry_after = 60  # Safe fallback
    current_limit = getattr(
        request.state, "view_rate_limit", None
    )
    if current_limit is not None:
        try:
            window_stats = limiter.limiter.get_window_stats(
                current_limit[0],
                *current_limit[1],
            )

            retry_after = max(
                1,
                ceil(window_stats[0] - time.time()),
            )
        except Exception:
            pass
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": {
                "message": "Too many requests. Please try again later.",
                "retry_after_seconds": retry_after,
            },
        },
        headers={"Retry-After": str(retry_after)},
    )

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
app.include_router(logs_router)