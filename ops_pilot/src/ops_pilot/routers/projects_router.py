from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ops_pilot.main import get_current_user
from ops_pilot.models.auth_model import UserModel
from ops_pilot.database import get_db
from ops_pilot.models.project_model import Project
from ops_pilot.schemas.project_schema import (
    ProjectCreateRequest,
    ProjectResponse,
    ProjectUpdateRequest,
)

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
)

# POST   /projects
@router.post("/", response_model=ProjectResponse, status_code=201)
def create_project(project_data: ProjectCreateRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    new_project = Project(**project_data.model_dump(), owner_id=current_user.id)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

# GET    /projects
@router.get("/", response_model=list[ProjectResponse])
def get_projects(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    # a user can get there own projects
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    return projects

# GET    /projects/{project_id}
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: UUID,current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter((Project.id == project_id) & (Project.owner_id == current_user.id)).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# PATCH  /projects/{project_id}
@router.patch('/{project_id}', response_model=ProjectResponse)
def update_project(project_id: UUID, data: ProjectUpdateRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter((Project.id == project_id) & (Project.owner_id == current_user.id)).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    updated_data = data.model_dump(exclude_unset=True)
    for key, value in updated_data.items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project

# DELETE /projects/{project_id}
@router.delete('/{project_id}')
def delete_project(project_id: UUID, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter((Project.id == project_id) & (Project.owner_id == current_user.id)).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"detail": "Project deleted successfully"}