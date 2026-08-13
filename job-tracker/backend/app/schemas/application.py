from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, HttpUrl

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
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    """What the API sends back. Includes server-generated fields
    the client never provided: id, user_id, status, timestamps.
    """
    # UUID, not int — both columns are postgres UUIDs. Declaring them as int
    # made Pydantic reject every row it was handed, so each of these endpoints
    # 500'd on the way out rather than on the way in.
    id: UUID
    user_id: UUID
    company_name: str
    role: str
    # The column is job_url; the API speaks job_link. AliasChoices lets
    # from_attributes read the model's job_url while keeping the request and
    # response bodies consistent with ApplicationCreate.
    job_link: Optional[str] = Field(
        default=None, validation_alias=AliasChoices("job_url", "job_link")
    )
    date_applied: date
    status: ApplicationStatus
    notes: Optional[str] = None
    interview_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    # This lets Pydantic build the schema directly from a SQLAlchemy
    # object (app.orm_model), instead of only from a dict.
    # populate_by_name keeps job_link usable as a plain key too, so a dict
    # built by hand in a test still validates.
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)