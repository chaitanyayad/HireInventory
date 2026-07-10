from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, HttpUrl

from app.models.application import ApplicationStatus  # reuse the same Enum as the model

class ApplicationCreate(BaseModel):
    """What the client sends when creating a new application.
    No id, no user_id, no status here — the server decides those.
    """
    company_name: str
    role: str
    job_link: Optional[HttpUrl] = None
    date_applied: date
    notes: Optional[str] = None
    interview_date: Optional[date] = None

class StatusUpdate(BaseModel):
    """The tiny payload for PATCH /applications/{id}/status.
    Deliberately just one field — this endpoint does one thing.
    """
    status: ApplicationStatu


class ApplicationResponse(BaseModel):
    """What the API sends back. Includes server-generated fields
    the client never provided: id, user_id, status, timestamps.
    """
    id: int
    user_id: int
    company_name: str
    role: str
    job_link: Optional[HttpUrl] = None
    date_applied: date
    status: ApplicationStatus
    notes: Optional[str] = None
    interview_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    # This lets Pydantic build the schema directly from a SQLAlchemy
    # object (app.orm_model), instead of only from a dict.
    model_config = ConfigDict(from_attributes=True)