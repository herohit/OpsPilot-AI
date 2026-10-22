from datetime import datetime, timedelta, timezone
from typing import Literal

from ops_pilot.models.environment_model import Environment
from ops_pilot.models.log_model import Log, LogSource
from ops_pilot.models.project_model import Project
from ops_pilot.models.service_model import Service
from ops_pilot.services.environment_service import get_environment
from ops_pilot.schemas.log_schema import LogEntryResponse, LogPageResponse, LogSourceCreateRequest
from sqlalchemy import String, cast, func, select
from sqlalchemy.orm import Session
from uuid import UUID


def _log_entry(log: Log, environment_name: str, service_id: UUID, service_name: str) -> dict:
    payload = log.payload if isinstance(log.payload, dict) else {}
    message_value = payload.get("message", payload.get("msg", payload))
    received_at = log.received_at
    if received_at.tzinfo is None:
        received_at = received_at.replace(tzinfo=timezone.utc)
    return {
        "id": log.id,
        "environment_id": log.environment_id,
        "environment_name": environment_name,
        "service_id": service_id,
        "service_name": service_name,
        "level": str(payload.get("level", payload.get("severity", "INFO"))).upper(),
        "message": message_value if isinstance(message_value, str) else str(message_value),
        "payload": payload,
        "received_at": received_at,
    }


def list_log_history(
    db: Session,
    owner_id: UUID,
    service_id: UUID | None,
    environment_id: UUID | None,
    page: int,
    page_size: int,
    *,
    search: str | None = None,
    level: str | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    sort: Literal["asc", "desc"] = "desc",
) -> LogPageResponse:
    statement = (
        select(Log, Environment.name, Service.id, Service.name)
        .join(Environment, Log.environment_id == Environment.id)
        .join(Service, Environment.service_id == Service.id)
        .join(Project, Service.project_id == Project.id)
        .where(Project.owner_id == owner_id)
    )
    if service_id is not None:
        statement = statement.where(Service.id == service_id)
    if environment_id is not None:
        statement = statement.where(Environment.id == environment_id)
    if search and search.strip():
        statement = statement.where(
            cast(Log.payload, String).icontains(search.strip(), autoescape=True)
        )
    if level is not None:
        stored_level = func.upper(func.coalesce(
            Log.payload["level"].as_string(),
            Log.payload["severity"].as_string(),
            "INFO",
        ))
        normalized_level = level.upper()
        if normalized_level in {"WARN", "WARNING"}:
            statement = statement.where(stored_level.in_(["WARN", "WARNING"]))
        else:
            statement = statement.where(stored_level == normalized_level)
    if start_time is not None:
        statement = statement.where(Log.received_at >= start_time)
    if end_time is not None:
        statement = statement.where(Log.received_at <= end_time)

    total = db.execute(
        select(func.count()).select_from(statement.subquery())
    ).scalar_one()
    order = (
        (Log.received_at.asc(), Log.id.asc())
        if sort == "asc" else (Log.received_at.desc(), Log.id.desc())
    )
    rows = db.execute(
        statement.order_by(*order)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return LogPageResponse(
        items=[LogEntryResponse.model_validate(_log_entry(*row)) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


def list_logs(
    db: Session,
    owner_id: UUID,
    service_id: UUID | None,
    environment_id: UUID | None,
    level: str | None,
    search: str | None,
    hours: int,
    limit: int,
) -> list[dict]:
    statement = (
        select(Log, Environment.name, Service.id, Service.name)
        .join(Environment, Log.environment_id == Environment.id)
        .join(Service, Environment.service_id == Service.id)
        .join(Project, Service.project_id == Project.id)
        .where(
            Project.owner_id == owner_id,
            Log.received_at >= datetime.now(timezone.utc) - timedelta(hours=hours),
        )
        .order_by(Log.received_at.desc())
    )
    if service_id is not None:
        statement = statement.where(Service.id == service_id)
    if environment_id is not None:
        statement = statement.where(Environment.id == environment_id)

    normalized_level = level.upper() if level else None
    search_text = search.casefold() if search else None
    entries = []
    for log, environment_name, current_service_id, service_name in db.execute(
        statement.limit(5000)
    ):
        entry = _log_entry(log, environment_name, current_service_id, service_name)
        if normalized_level and entry["level"] != normalized_level:
            continue
        if search_text and search_text not in entry["message"].casefold():
            continue
        entries.append(entry)
        if len(entries) >= limit:
            break
    return entries

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

    