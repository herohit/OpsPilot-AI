from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ops_pilot.database import get_db
from ops_pilot.models.auth_model import UserModel
from ops_pilot.schemas.service_schema import (
    ServiceCreateRequest,
    ServiceResponse,
    ServiceUpdateRequest,
)
from ops_pilot.services import service_service
from ops_pilot.services.auth_service import get_current_user


router = APIRouter(prefix="/projects/{project_id}/services", tags=["services"])


@router.post("", response_model=ServiceResponse)
def create_service(
    project_id: UUID,
    data: ServiceCreateRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_service.create_service(db, project_id, current_user.id, data)


@router.get("", response_model=list[ServiceResponse])
def get_services(
    project_id: UUID,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_service.get_services(db, project_id, current_user.id)


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(
    project_id: UUID,
    service_id: UUID,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_service.get_service(db, project_id, service_id, current_user.id)


@router.patch("/{service_id}", response_model=ServiceResponse)
def update_service(
    project_id: UUID,
    service_id: UUID,
    data: ServiceUpdateRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_service.update_service(
        db, project_id, service_id, current_user.id, data
    )


@router.delete("/{service_id}")
def delete_service(
    project_id: UUID,
    service_id: UUID,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_service.delete_service(db, project_id, service_id, current_user.id)
