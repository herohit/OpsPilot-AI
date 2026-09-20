from fastapi import FastAPI
from contextlib  import asynccontextmanager
from shopflow.routers.products import router as product_router
from shopflow.database import Base, engine
from shopflow import log as logger_module
logger = logger_module.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("App started")
    Base.metadata.create_all(bind=engine)
    yield
    logger.info("App stopped")

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root():
    logger.info("Root endpoint called")
    routes = ["GET /products","POST /orders"]
    logger.info("Returning root response")
    return {"message": "This is a demo app","routes":routes}

app.include_router(product_router)
