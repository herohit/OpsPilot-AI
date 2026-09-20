from shopflow.database import Base
from sqlalchemy import Column, Integer, String, TIMESTAMP, Boolean, text
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Product(Base):
    __tablename__ ='products'
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Integer, nullable=False)
    in_stock = Column(Boolean, nullable=False, server_default=text("1"))
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))