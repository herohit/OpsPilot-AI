from shopflow.database import Base
from sqlalchemy import Column, Integer, Numeric, String, TIMESTAMP, Boolean, text
import uuid
from sqlalchemy.dialects.postgresql import UUID as PGUUID

def generate_uuid():
    return str(uuid.uuid4())

class Product(Base):
    __tablename__ ='products'
    id = Column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    in_stock = Column(Boolean, nullable=False, server_default=text("1"))
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))