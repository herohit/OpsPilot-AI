from fastapi import APIRouter,Depends
from shopflow.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(tags=['products'])

@router.get('/products')
def get_products(db :Session = Depends(get_db)):
    products = []
    return products

@router.post('/products')
def add_product(data:dict,db :Session = Depends(get_db)):
    return data

@router.delete('/products')
def delete_product(id:int,db :Session = Depends(get_db)):
    return id

@router.put('/products')
def update_product(id:int,db :Session = Depends(get_db)):
    return id
    