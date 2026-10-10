from datetime import datetime
from uuid import UUID

from typing import Literal

from pydantic import BaseModel, ConfigDict

ProjectIconKey = Literal["briefcase", "network", "box", "lock", "code"]

class ProjectCreateRequest(BaseModel):
    name: str
    description: str | None = None
    icon_key: ProjectIconKey = "briefcase"

    model_config = ConfigDict(from_attributes=True)

class ProjectUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)

class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    icon_key: ProjectIconKey
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)