from datetime import datetime , date
from typing import Optional
from pydantic import BaseModel , HttpUrl , ConfigDict

from app.models.application import ApplicationStatus

class ApplicationCreate(BaseModel):
     """What the client sends when creating a new application.
    No id, no user_id, no status here — the server decides those.
    """
    company_name = str
    role = str
    job_link = Optional[HttpUrl] = None
    date_applied = date
    notes = Optional[str] = None
    interview_date = Optional[date] = None
