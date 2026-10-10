from datetime import datetime
from uuid import UUID, uuid4

from ops_pilot.database import Base
from sqlalchemy import DateTime, ForeignKey, String, Uuid, text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    icon_key: Mapped[str] = mapped_column(
        String(32), nullable=False, default="briefcase", server_default=text("'briefcase'")
    )
    owner_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("user.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)
    
    __table_args__ = (
        UniqueConstraint('name', 'owner_id', name='uq_project_name_owner_id'),
    )