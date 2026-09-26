from fastapi import APIRouter, Depends
from ops_pilot.models.auth_model import UserModel
from sqlalchemy.orm import Session
from uuid import UUID
from ops_pilot.schemas.log_schema import LogSourceCreateRequest, LogSourceResponse
from sqlalchemy.orm import Session

from ops_pilot.database import get_db
from ops_pilot.services.auth_service import get_current_user
from ops_pilot.services import log_service

router = APIRouter(prefix="/projects/{project_id}/services/{service_id}/environments/{environment_id}/log-sources",tags=["log-sources"])

@router.get("", response_model=list[LogSourceResponse])
async def list_log_sources(
    project_id: UUID,
    service_id: UUID,
    environment_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return log_service.list_log_sources(project_id, service_id, environment_id, db, current_user.id)

@router.get("/{log_source_id}", response_model=LogSourceResponse)
async def get_log_source(
    project_id: UUID,
    service_id: UUID,
    environment_id: UUID,
    log_source_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return log_service.get_log_source(project_id, service_id, environment_id, log_source_id, db, current_user.id)


@router.post("", response_model=LogSourceResponse)
async def create_log_source(
    project_id: UUID,
    service_id: UUID,
    environment_id: UUID,
    log_source: LogSourceCreateRequest,
    db: Session = Depends(get_db),
    current_user:UserModel = Depends(get_current_user),
):
    return log_service.create_log_source(project_id, service_id, environment_id, log_source, db, current_user.id)


@router.put("/{log_source_id}", response_model=LogSourceResponse)
async def update_log_source(
    project_id: UUID,
    service_id: UUID,
    environment_id: UUID,
    log_source_id: UUID,
    log_source: LogSourceCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return log_service.update_log_source(project_id, service_id, environment_id, log_source_id, log_source, db, current_user.id)

@router.delete("/{log_source_id}", response_model=LogSourceResponse)
async def delete_log_source(
    project_id: UUID,
    service_id: UUID,
    environment_id: UUID,
    log_source_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return log_service.delete_log_source(project_id, service_id, environment_id, log_source_id, db, current_user.id)
