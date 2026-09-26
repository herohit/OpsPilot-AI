from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ops_pilot.models.project_model import Project
from ops_pilot.schemas.project_schema import ProjectCreateRequest, ProjectUpdateRequest


def create_project(db: Session, owner_id: UUID, data: ProjectCreateRequest) -> Project:
    statement = select(Project).where(
        Project.name == data.name, Project.owner_id == owner_id
    )
    if db.scalar(statement):
        raise HTTPException(
            status_code=409, detail="A project with this name already exists"
        )

    project = Project(**data.model_dump(), owner_id=owner_id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def get_projects(db: Session, owner_id: UUID):
    return db.scalars(select(Project).where(Project.owner_id == owner_id)).all()


def get_project(db: Session, project_id: UUID, owner_id: UUID) -> Project:
    project = db.scalar(
        select(Project).where(Project.id == project_id, Project.owner_id == owner_id)
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def update_project(
    db: Session, project_id: UUID, owner_id: UUID, data: ProjectUpdateRequest
) -> Project:
    project = get_project(db, project_id, owner_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: UUID, owner_id: UUID) -> dict[str, str]:
    project = get_project(db, project_id, owner_id)
    db.delete(project)
    db.commit()
    return {"detail": "Project deleted successfully"}
