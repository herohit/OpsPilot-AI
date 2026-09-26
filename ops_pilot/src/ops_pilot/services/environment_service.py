from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ops_pilot.models.environment_model import Environment
from ops_pilot.schemas.environment_schema import (
    EnvironmentCreateRequest,
    EnvironmentUpdateRequest,
)
from ops_pilot.services.service_service import get_service


def get_environments(db: Session, project_id: UUID, service_id: UUID, owner_id: UUID):
    get_service(db, project_id, service_id, owner_id)
    return db.scalars(
        select(Environment).where(
            Environment.project_id == project_id, Environment.service_id == service_id
        )
    ).all()


def create_environment(
    db: Session,
    project_id: UUID,
    service_id: UUID,
    owner_id: UUID,
    data: EnvironmentCreateRequest,
) -> Environment:
    get_service(db, project_id, service_id, owner_id)
    existing = db.scalar(
        select(Environment).where(
            Environment.service_id == service_id, Environment.name == data.name
        )
    )
    if existing:
        raise HTTPException(
            status_code=409, detail="Environment with this name already exists"
        )

    environment = Environment(
        **data.model_dump(), project_id=project_id, service_id=service_id
    )
    db.add(environment)
    db.commit()
    db.refresh(environment)
    return environment


def get_environment(
    db: Session,
    project_id: UUID,
    service_id: UUID,
    environment_id: UUID,
    owner_id: UUID,
) -> Environment:
    get_service(db, project_id, service_id, owner_id)
    environment = db.scalar(
        select(Environment).where(
            Environment.id == environment_id,
            Environment.project_id == project_id,
            Environment.service_id == service_id,
        )
    )
    if environment is None:
        raise HTTPException(status_code=404, detail="Environment not found")
    return environment


def update_environment(
    db: Session,
    project_id: UUID,
    service_id: UUID,
    environment_id: UUID,
    owner_id: UUID,
    data: EnvironmentUpdateRequest,
) -> Environment:
    environment = get_environment(db, project_id, service_id, environment_id, owner_id)
    if data.name is not None and data.name != environment.name:
        existing = db.scalar(
            select(Environment).where(
                Environment.service_id == service_id, Environment.name == data.name
            )
        )
        if existing:
            raise HTTPException(
                status_code=409, detail="Environment with this name already exists"
            )
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(environment, key, value)
    db.commit()
    db.refresh(environment)
    return environment


def delete_environment(
    db: Session,
    project_id: UUID,
    service_id: UUID,
    environment_id: UUID,
    owner_id: UUID,
) -> dict[str, str]:
    environment = get_environment(db, project_id, service_id, environment_id, owner_id)
    db.delete(environment)
    db.commit()
    return {"detail": "Environment deleted successfully"}
