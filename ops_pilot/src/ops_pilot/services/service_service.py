from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ops_pilot.models.service_model import Service
from ops_pilot.schemas.service_schema import ServiceCreateRequest, ServiceUpdateRequest
from ops_pilot.services.project_service import get_project


def create_service(
    db: Session, project_id: UUID, owner_id: UUID, data: ServiceCreateRequest
) -> Service:
    get_project(db, project_id, owner_id)
    service = Service(**data.model_dump(), project_id=project_id)
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


def get_services(db: Session, project_id: UUID, owner_id: UUID):
    get_project(db, project_id, owner_id)
    return db.scalars(select(Service).where(Service.project_id == project_id)).all()


def get_service(
    db: Session, project_id: UUID, service_id: UUID, owner_id: UUID
) -> Service:
    get_project(db, project_id, owner_id)
    service = db.scalar(
        select(Service).where(
            Service.id == service_id, Service.project_id == project_id
        )
    )
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


def update_service(
    db: Session,
    project_id: UUID,
    service_id: UUID,
    owner_id: UUID,
    data: ServiceUpdateRequest,
) -> Service:
    service = get_service(db, project_id, service_id, owner_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(service, key, value)
    db.commit()
    db.refresh(service)
    return service


def delete_service(
    db: Session, project_id: UUID, service_id: UUID, owner_id: UUID
) -> dict[str, str]:
    service = get_service(db, project_id, service_id, owner_id)
    db.delete(service)
    db.commit()
    return {"detail": "Service deleted successfully"}
