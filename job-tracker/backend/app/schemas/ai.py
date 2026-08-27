from uuid import UUID

from pydantic import BaseModel, model_validator


class InsightResponse(BaseModel):
    """What POST /ai/analyze sends back — the raw text Gemini wrote,
    plus how many applications it was based on (so the frontend can
    show "not enough data yet" instead of a thin AI response).
    """
    insight: str
    applications_analyzed: int


class CoverLetterRequest(BaseModel):
    company_name: str
    role: str
    skills: str  # free-text, comma-separated or a short paragraph


class CoverLetterResponse(BaseModel):
    content: str


class InterviewPrepRequest(BaseModel):
    """Either point at one of your own applications (application_id) and let the
    server fill in company/role, or pass company_name + role directly for a
    company you haven't logged yet.
    """
    # UUID to match JobApplication.id — an int here never matched a real row.
    application_id: UUID | None = None
    company_name: str | None = None
    role: str | None = None

    @model_validator(mode="after")
    def require_application_or_company_and_role(self) -> "InterviewPrepRequest":
        if self.application_id is None and not (self.company_name and self.role):
            raise ValueError(
                "Provide either application_id, or both company_name and role."
            )
        return self


class InterviewPrepResponse(BaseModel):
    # company/role are echoed back because they may have come from the DB
    # (application_id) rather than from the request body.
    company_name: str
    role: str
    prep: str
