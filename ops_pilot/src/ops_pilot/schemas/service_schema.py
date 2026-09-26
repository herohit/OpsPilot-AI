from datetime import datetime
from uuid import UUID
from pydantic import BaseModel



from pydantic import BaseModel, ConfigDict


class ServiceCreateRequest(BaseModel):
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)
    
class ServiceUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)

class ServiceResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    project_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)