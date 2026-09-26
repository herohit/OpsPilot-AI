
from uuid import UUID
from fastapi import HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from ops_pilot.models.deployment_model import Deployment
from ops_pilot.schemas.deployment_schema import DeploymentUpdateRequest
from ops_pilot.services.environment_service import get_environment


def get_deployment(db: Session, project_id: UUID, service_id: UUID, environment_id: UUID, deployment_id: UUID, current_user_id: UUID):
    get_environment(db, project_id, service_id, environment_id, current_user_id)
    deployment = db.scalar(select(Deployment).where(Deployment.id == deployment_id, Deployment.environment_id == environment_id))
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment

def get_deployments(db: Session, project_id: UUID, service_id: UUID, environment_id: UUID, current_user_id: UUID):
    get_environment(db, project_id, service_id,
                    environment_id, current_user_id)
    return db.scalars(select(Deployment).where(Deployment.environment_id == environment_id)).all()

def update_deployment(db: Session, project_id: UUID, service_id: UUID, environment_id: UUID, deployment_id: UUID, current_user_id: UUID, data: DeploymentUpdateRequest):
    get_environment(db, project_id, service_id, environment_id, current_user_id)
    deployment = db.scalar(select(Deployment).where(Deployment.id == deployment_id, Deployment.environment_id == environment_id))
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    deployment.status = data.status
    db.commit()
    db.refresh(deployment)
    return deployment

def create_deployment(db: Session, project_id: UUID, service_id: UUID, environment_id: UUID, current_user_id: UUID,data):
    get_environment(db, project_id, service_id,
                    environment_id, current_user_id)
    stmt = select(Deployment).where(Deployment.environment_id == environment_id, Deployment.version == data.version,Deployment.commit_sha == data.commit_sha)
    existing_deployment = db.scalar(stmt)
    if existing_deployment:
        raise HTTPException(
            status_code=409, detail="Deployment with this version and commit SHA already exists"
        )
    deployment = Deployment(
    **data.model_dump(),
    environment_id=environment_id
)
    db.add(deployment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if db.scalar(stmt):
            raise HTTPException(
                status_code=409, detail="Deployment with this version and commit SHA already exists"
            )
        raise
    db.refresh(deployment)
    return deployment