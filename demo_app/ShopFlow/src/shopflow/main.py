from pathlib import Path

from fastapi import FastAPI
from contextlib  import asynccontextmanager
from shopflow.routers.products import router as product_router
from shopflow.database import Base, engine
from shopflow import log as logger_module
logger = logger_module.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.debug("App started")
    Base.metadata.create_all(bind=engine)
    yield
    logger.debug("App stopped")

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root():
    logger.debug("Root endpoint called")
    routes = ["GET /products","POST /orders"]
    logger.debug("Returning root response")
    return {"message": "This is a demo app","routes":routes}

app.include_router(product_router)

import asyncio
from fastapi.responses import StreamingResponse


async def log_generator():
    log_path = Path(__file__).resolve().parents[2] / "logs" / "app.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.touch(exist_ok=True)

    with open(log_path, "r", encoding="utf-8") as file:
        # Move to the end of the file so we only stream new log entries.
        file.seek(0, 2)
        print(f"Watching log file: {log_path}")
        print("Starting log streaming...")

        while True:
            line = file.readline()
            if line:
                yield line.rstrip() + "\n"
            else:
                await asyncio.sleep(0.5)

@app.get("/logs/stream")
async def stream_logs():
    return StreamingResponse(
        log_generator(),
        media_type="application/x-ndjson",
    )
