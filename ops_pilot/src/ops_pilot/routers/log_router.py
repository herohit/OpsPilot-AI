import asyncio
import json

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from ops_pilot.models.auth_model import UserModel
from ops_pilot.models.environment_model import Environment
from ops_pilot.models.project_model import Project
from ops_pilot.models.service_model import Service
from sqlalchemy import select
from sqlalchemy.orm import Session
from uuid import UUID
from ops_pilot.schemas.log_schema import (
    LogEntryResponse,
    LogPageResponse,
    LogSourceCreateRequest,
    LogSourceResponse,
)
from sqlalchemy.orm import Session

from ops_pilot.database import get_db
from ops_pilot.services.auth_service import get_current_user
from ops_pilot.services import log_service
from ops_pilot.services.log_stream import log_stream_hub

router = APIRouter(prefix="/projects/{project_id}/services/{service_id}/environments/{environment_id}/log-sources",tags=["log-sources"])
logs_router = APIRouter(prefix="/logs", tags=["logs"])


@logs_router.get("/history", response_model=LogPageResponse)
def list_log_history(
    service_id: UUID | None = None,
    environment_id: UUID | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return log_service.list_log_history(
        db, current_user.id, service_id, environment_id, page, page_size
    )


@logs_router.get("/stream")
async def stream_logs(
    request: Request,
    service_id: UUID | None = None,
    environment_id: UUID | None = None,
    level: str | None = None,
    search: str | None = None,
    hours: int = Query(default=1, ge=1, le=168),
    limit: int = Query(default=500, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    subscriber = log_stream_hub.subscribe()
    try:
        environment_query = (
            select(Environment.id, Environment.name, Environment.service_id, Service.name)
            .join(Service, Environment.service_id == Service.id)
            .join(Project, Service.project_id == Project.id)
            .where(Project.owner_id == current_user.id)
        )
        if service_id is not None:
            environment_query = environment_query.where(Service.id == service_id)
        if environment_id is not None:
            environment_query = environment_query.where(Environment.id == environment_id)
        environment_details = {
            str(current_environment_id): {
                "environment_name": environment_name,
                "service_id": str(current_service_id),
                "service_name": service_name,
            }
            for current_environment_id, environment_name, current_service_id, service_name
            in db.execute(environment_query)
        }
        snapshot = log_service.list_logs(
            db,
            current_user.id,
            service_id,
            environment_id,
            level,
            search,
            hours,
            limit,
        )
        db.close()
    except Exception:
        log_stream_hub.unsubscribe(subscriber)
        raise

    async def event_stream():
        try:
            yield f"event: snapshot\ndata: {json.dumps(snapshot, default=str)}\n\n"
            while not await request.is_disconnected():
                try:
                    event = await asyncio.wait_for(subscriber.get(), timeout=15)
                except TimeoutError:
                    yield ": keep-alive\n\n"
                    continue

                details = environment_details.get(event["environment_id"])
                if details is None:
                    continue
                payload = event["payload"]
                current_level = str(
                    payload.get("level", payload.get("severity", "INFO"))
                ).upper()
                message_value = payload.get("message", payload.get("msg", payload))
                message = message_value if isinstance(message_value, str) else str(message_value)
                if level and current_level != level.upper():
                    continue
                if search and search.casefold() not in message.casefold():
                    continue

                event_data = {
                    **event,
                    **details,
                    "level": current_level,
                    "message": message,
                }
                yield f"event: log\ndata: {json.dumps(event_data, default=str)}\n\n"
        finally:
            log_stream_hub.unsubscribe(subscriber)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@logs_router.get("", response_model=list[LogEntryResponse])
def list_logs(
    service_id: UUID | None = None,
    environment_id: UUID | None = None,
    level: str | None = None,
    search: str | None = None,
    hours: int = Query(default=1, ge=1, le=168),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return log_service.list_logs(
        db,
        current_user.id,
        service_id,
        environment_id,
        level,
        search,
        hours,
        limit,
    )

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
