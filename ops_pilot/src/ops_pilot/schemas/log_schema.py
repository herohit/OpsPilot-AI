from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class LogSourceCreateRequest(BaseModel):
    environment_id: UUID
    stream_url: str
    source_type: Optional[str] = "http_stream"
    
    
    model_config = ConfigDict(from_attributes=True)
    
class LogSourceUpdateRequest(BaseModel):
    stream_url: Optional[str]
    source_type: Optional[str]

    model_config = ConfigDict(from_attributes=True)
    
class LogSourceResponse(BaseModel):
    id: UUID
    environment_id: UUID
    stream_url: str
    source_type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
    