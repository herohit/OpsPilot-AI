from datetime import datetime
from uuid import UUID, uuid4

from ops_pilot.database import Base
from sqlalchemy import DateTime, ForeignKey, String, Uuid, text,UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

class Service(Base):
    __tablename__ = "services"

    id : Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name : Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    project_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)
    
    __table_args__ = (
        UniqueConstraint('name', 'project_id', name='uq_service_name_project_id'),
    )