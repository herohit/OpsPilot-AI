from ops_pilot.database import Base
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Uuid, text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column


class LogSource(Base):
    __tablename__ = "log_sources"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    environment_id: Mapped[UUID] = mapped_column(ForeignKey("environment.id"),nullable=False)
    stream_url: Mapped[str] = mapped_column(nullable=False)
    source_type: Mapped[str] = mapped_column(nullable=False,default="http_stream")
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)
    
    __table_args__ = (
        UniqueConstraint("environment_id", "stream_url", name="uq_environment_stream"),
    )