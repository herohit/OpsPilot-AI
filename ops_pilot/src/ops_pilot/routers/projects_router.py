from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ops_pilot.database import get_db
from ops_pilot.models.auth_model import UserModel
from ops_pilot.schemas.project_schema import (
    ProjectCreateRequest,
    ProjectResponse,
    ProjectUpdateRequest,
)
from ops_pilot.services.auth_service import get_current_user
from ops_pilot.services import project_service


router = APIRouter(
    prefix="/projects",
    tags=["projects"],
)


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(
    project_data: ProjectCreateRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return project_service.create_project(db, current_user.id, project_data)


@router.get("", response_model=list[ProjectResponse])
def get_projects(
    current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)
):
    return project_service.get_projects(db, current_user.id)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return project_service.get_project(db, project_id, current_user.id)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID,
    data: ProjectUpdateRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return project_service.update_project(db, project_id, current_user.id, data)


@router.delete("/{project_id}")
def delete_project(
    project_id: UUID,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return project_service.delete_project(db, project_id, current_user.id)
