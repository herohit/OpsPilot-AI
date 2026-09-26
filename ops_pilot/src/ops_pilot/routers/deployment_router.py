# GET /projects/{project_id}/services/{service_id}/environments/{environment_id}/deployments
from fastapi import APIRouter, Depends
from uuid import UUID
from ops_pilot.database import get_db
from ops_pilot.models.auth_model import UserModel
from ops_pilot.schemas.deployment_schema import DeploymentCreateRequest, DeploymentUpdateRequest
from ops_pilot.services.auth_service import get_current_user
from sqlalchemy.orm import Session
from ops_pilot.services import deployment_service

router = APIRouter(
    prefix="/projects/{project_id}/services/{service_id}/environments/{environment_id}/deployments",
    tags=["deployments"])


@router.get("")
def get_deployments(project_id: UUID, service_id: UUID, environment_id: UUID, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    return deployment_service.get_deployments(db, project_id, service_id, environment_id, current_user.id)

@router.get("/{deployment_id}")
def get_deployment(project_id: UUID, service_id: UUID, environment_id: UUID, deployment_id: UUID, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    return deployment_service.get_deployment(db, project_id, service_id, environment_id, deployment_id, current_user.id)


@router.post("")
def create_deployment(project_id: UUID, service_id: UUID, environment_id: UUID, data: DeploymentCreateRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    return deployment_service.create_deployment(db, project_id, service_id, environment_id, current_user.id, data)

@router.patch("/{deployment_id}")
def update_deployment(project_id: UUID, service_id: UUID, environment_id: UUID, deployment_id: UUID, data: DeploymentUpdateRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    return deployment_service.update_deployment(db, project_id, service_id, environment_id, deployment_id, current_user.id, data)