from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class EnvironmentCreateRequest(BaseModel):
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class EnvironmentUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class EnvironmentReadResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    project_id: UUID
    service_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
