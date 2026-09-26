from ops_pilot.services.environment_service import get_environment
from ops_pilot.models.log_model import LogSource
from ops_pilot.schemas.log_schema import LogSourceCreateRequest
from sqlalchemy import select
from sqlalchemy.orm import Session
from uuid import UUID

def get_log_source(project_id:UUID, service_id:UUID, environment_id:UUID, log_source_id:UUID, db:Session, current_user_id:UUID):
    get_environment(db, project_id, service_id, environment_id, current_user_id)
    existing_log_source = db.scalar(
        select(LogSource).where(
            (LogSource.id == log_source_id) &
            (LogSource.environment_id == environment_id)
        )
    )
    if not existing_log_source:
        raise ValueError("Log source not found in the environment")
    return existing_log_source

def list_log_sources(project_id:UUID, service_id:UUID, environment_id:UUID, db:Session, current_user_id:UUID):
    get_environment(db, project_id, service_id, environment_id, current_user_id)
    return db.scalars(
        select(LogSource).where(
            (LogSource.environment_id == environment_id)
        )
    ).all()

def create_log_source(project_id:UUID, service_id:UUID, environment_id:UUID, log_source_data:LogSourceCreateRequest, db:Session, current_user_id:UUID):
    get_environment(db, project_id, service_id, environment_id, current_user_id)
    # Check for existing log source with the same name in the environment
    existing_log_source = db.scalar(
        select(LogSource).where(
            (LogSource.environment_id == environment_id) &
            (LogSource.stream_url == log_source_data.stream_url)
        )
    )
    if existing_log_source:
        raise ValueError("Log source with the same name already exists in the environment")
    
    new_log_source = LogSource(**log_source_data.model_dump(),environment_id=environment_id)
    db.add(new_log_source)
    db.commit()
    db.refresh(new_log_source)
    return new_log_source

def update_log_source(project_id:UUID, service_id:UUID, environment_id:UUID, log_source_id:UUID, log_source_data:LogSourceCreateRequest, db:Session, current_user_id:UUID):
    get_environment(db, project_id, service_id, environment_id, current_user_id)
    existing_log_source = db.scalar(
        select(LogSource).where(
            (LogSource.id == log_source_id) &
            (LogSource.environment_id == environment_id)
        )
    )
    if not existing_log_source:
        raise ValueError("Log source not found in the environment")
    
    for key, value in log_source_data.model_dump(exclude_unset=True).items():
        setattr(existing_log_source, key, value)
    
    db.commit()
    db.refresh(existing_log_source)
    return existing_log_source

def delete_log_source(project_id:UUID, service_id:UUID, environment_id:UUID, log_source_id:UUID, db:Session, current_user_id:UUID):
    get_environment(db, project_id, service_id, environment_id, current_user_id)
    existing_log_source = db.scalar(
        select(LogSource).where(
            (LogSource.id == log_source_id) &
            (LogSource.environment_id == environment_id)
        )
    )
    if not existing_log_source:
        raise ValueError("Log source not found in the environment")
    
    db.delete(existing_log_source)
    db.commit()
    return existing_log_source

    