from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

class ProjectCreateRequest(BaseModel):
    name: str
    description: str | None = None

class ProjectUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None

class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)