from pydantic import BaseModel


class InsightResponse(BaseModel):
    """What POST /ai/analyze sends back — the raw text Claude wrote,
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
