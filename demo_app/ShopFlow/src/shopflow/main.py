from fastapi import FastAPI
from shopflow.routers.products import router as product_router
from shopflow.database import Base, engine, get_db
from shopflow.models.product import Product
from sqlalchemy.orm import Session

app = FastAPI()


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    routes = ["GET /products","POST /orders"]
    return {"message": "This is a demo app","routes":routes}

app.include_router(product_router)
