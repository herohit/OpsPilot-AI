from fastapi import APIRouter,Depends, HTTPException
from shopflow.database import get_db
from sqlalchemy.orm import Session
from shopflow.schemas.product import Product, ProductResponse, ProductUpdate
from shopflow.models.product import Product as ProductModel

router = APIRouter(tags=['products'])

@router.get('/products', response_model=list[ProductResponse])
def get_products(db :Session = Depends(get_db)):
    products = db.query(ProductModel).all()
    return products

@router.post('/products',response_model=ProductResponse)
def add_product(data:Product,db :Session = Depends(get_db)):
    product = ProductModel(
        name=data.name,
        description=data.description,
        price=data.price,
        in_stock=data.in_stock
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.delete('/products')
def delete_product(id:str,db :Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {
        "message": "Product deleted successfully",
        "product_id": id
    }

@router.patch('/products')
def update_product(id:str, data:ProductUpdate, db :Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product
    