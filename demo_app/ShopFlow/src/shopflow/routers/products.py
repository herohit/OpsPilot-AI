import random
from uuid import UUID

from fastapi import APIRouter,Depends, HTTPException
from shopflow.database import get_db
from sqlalchemy import select
from sqlalchemy.orm import Session
from shopflow.schemas.product import Product, ProductResponse, ProductUpdate
from shopflow.models.product import Product as ProductModel
from shopflow import log as logger_module

router = APIRouter(tags=['products'])
logger = logger_module.get_logger(logger_name="shopflow.products")

@router.get('/products', response_model=list[ProductResponse])
def get_products(db :Session = Depends(get_db)):
    logger.info("Fetching all products")
    products = db.scalars(select(ProductModel)).all()
    logger.info("Products fetched", extra={"count": len(products)})
    return products

@router.post('/products',response_model=ProductResponse)
def add_product(data:Product,db :Session = Depends(get_db)):
    logger.info("Creating product", extra={"name": data.name})
    product = ProductModel(
        name=data.name,
        description=data.description,
        price=data.price,
        in_stock=data.in_stock
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    logger.info("Product created", extra={"id": str(product.id)})
    return product

@router.delete('/products')
def delete_product(id: UUID, db: Session = Depends(get_db)):
    logger.info("Deleting product", extra={"id": str(id)})
    stmt = select(ProductModel).where(ProductModel.id == id)
    product = db.scalar(stmt)
    if not product:
        logger.warning("Product not found for delete", extra={"id": str(id)})
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    logger.info("Product deleted", extra={"id": str(id)})
    return {
        "message": "Product deleted successfully",
        "product_id": str(id)
    }

@router.patch('/products')
def update_product(id: UUID, data: ProductUpdate, db: Session = Depends(get_db)):
    logger.info("Updating product", extra={"id": str(id)})
    stmt = select(ProductModel).where(ProductModel.id == id)
    product = db.scalar(stmt)
    if not product:
        logger.warning("Product not found for update", extra={"id": str(id)})
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)
    logger.info("Applying product updates", extra={"id": str(id), "fields": list(update_data.keys())})

    for key, value in update_data.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    logger.info("Product updated", extra={"id": str(id)})
    return product
    

LOG_MESSAGES = {
    "debug": [
        "Cache lookup completed successfully",
        "Request validation completed",
        "Worker heartbeat received",
    ],
    "info": [
        "User logged in successfully",
        "Database query executed successfully",
        "Background job completed",
        "API request processed successfully",
    ],
    "warning": [
        "API response time exceeded threshold",
        "Database connection pool is nearly full",
        "Retrying failed request",
    ],
    "error": [
        "Failed to connect to database",
        "Background job execution failed",
        "External API request failed",
    ],
    "critical": [
        "Database connection limit reached",
        "Worker service is unavailable",
    ],
}


@router.get("/generate_logs")
def generate_random_logs():
    for _ in range(10):
        level = random.choice(list(LOG_MESSAGES.keys()))
        message = random.choice(LOG_MESSAGES[level])

        getattr(logger, level)(message)

    return {"message": "Logs generated successfully"}
