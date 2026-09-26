from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from ops_pilot.models.deployment_model import DeploymentStatus


class DeploymentCreateRequest(BaseModel):
    version: str
    commit_sha: str

    model_config = ConfigDict(from_attributes=True)


class DeploymentUpdateRequest(BaseModel):
    status: DeploymentStatus

    model_config = ConfigDict(extra="forbid")


class DeploymentReadResponse(BaseModel):
    id: UUID
    environment_id: UUID
    version: str
    commit_sha: str
    status: str
    deployed_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
