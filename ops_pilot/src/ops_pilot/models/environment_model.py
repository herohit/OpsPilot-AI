from ops_pilot.database import Base
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Uuid, text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from ops_pilot.models.deployment_model import Deployment
    from ops_pilot.models.log_model import Log, LogSource
    from ops_pilot.models.service_model import Service


class Environment(Base):
    __tablename__ = "environments"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    project_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
    )

    service_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("services.id"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

    service: Mapped["Service"] = relationship(back_populates="environments")
    deployments: Mapped[list["Deployment"]] = relationship(
        back_populates="environment", cascade="all, delete-orphan"
    )
    logs: Mapped[list["Log"]] = relationship(
        back_populates="environment", cascade="all, delete-orphan"
    )
    log_sources: Mapped[list["LogSource"]] = relationship(
        back_populates="environment", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint(
            "name",
            "service_id",
            name="uq_environment_name_service_id",
        ),
    )