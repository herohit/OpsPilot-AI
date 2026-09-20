from datetime import datetime
from decimal import Decimal
from typing import Annotated, Optional
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID

PriceDecimal = Annotated[
    Decimal,
    Field(max_digits=10, decimal_places=2, json_schema_extra={"example": "99.99"}),
]

class Product(BaseModel):
    name : str
    description : Optional[str] = None
    price : PriceDecimal
    in_stock : bool

class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id : UUID
    name : str
    description : Optional[str] = None
    price : PriceDecimal
    in_stock : bool
    created_at : datetime

class ProductUpdate(BaseModel):
    name : Optional[str] = None
    description : Optional[str] = None
    price : Optional[PriceDecimal] = None
    in_stock : Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)