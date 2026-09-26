from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ops_pilot.database import get_db
from ops_pilot.models.auth_model import UserModel
from ops_pilot.schemas.environment_schema import (
    EnvironmentCreateRequest,
    EnvironmentReadResponse,
    EnvironmentUpdateRequest,
)
from ops_pilot.services import environment_service
from ops_pilot.services.auth_service import get_current_user

router = APIRouter(
    prefix="/projects/{project_id}/services/{service_id}/environments",
    tags=["environments"],
)


@router.get("", response_model=list[EnvironmentReadResponse])
def get_environments(
    project_id: UUID,
    service_id: UUID,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return environment_service.get_environments(
        db, project_id, service_id, current_user.id
    )


@router.post("", response_model=EnvironmentReadResponse)
def create_environment(
    project_id: UUID,
    service_id: UUID,
    environment: EnvironmentCreateRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return environment_service.create_environment(
        db, project_id, service_id, current_user.id, environment
    )


@router.put("/{environment_id}", response_model=EnvironmentReadResponse)
def update_environment(
    project_id: UUID,
    service_id: UUID,
    environment_id: UUID,
    environment: EnvironmentUpdateRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return environment_service.update_environment(
        db, project_id, service_id, environment_id, current_user.id, environment
    )


@router.delete("/{environment_id}")
def delete_environment(
    project_id: UUID,
    service_id: UUID,
    environment_id: UUID,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return environment_service.delete_environment(
        db, project_id, service_id, environment_id, current_user.id
    )
