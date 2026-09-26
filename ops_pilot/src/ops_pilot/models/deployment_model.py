from ops_pilot.database import Base
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    String,
    Uuid,
    text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column


class DeploymentStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Deployment(Base):
    __tablename__ = "deployments"
    __table_args__ = (
        UniqueConstraint(
            "environment_id", "version", "commit_sha", name="uq_deployment_environment_version_commit"
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    environment_id: Mapped[UUID] = mapped_column(ForeignKey("environments.id"),nullable=False)
    version: Mapped[str] = mapped_column(String(100), nullable=False)

    commit_sha: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[DeploymentStatus] = mapped_column(
        SQLEnum(
            DeploymentStatus,
            name="deployment_status",
            values_callable=lambda statuses: [member.value for member in statuses],
            native_enum=False,
            create_constraint=True,
        ),
        default=DeploymentStatus.RUNNING,
    )
    deployed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
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
