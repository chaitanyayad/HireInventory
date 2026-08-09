from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.ai import (
    CoverLetterRequest,
    CoverLetterResponse,
    InsightResponse,
    InterviewPrepRequest,
    InterviewPrepResponse,
)
from app.services import ai_service, application_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze", response_model=InsightResponse)
def analyze(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    applications = application_service.list_all_applications(db, current_user.id)
    insight = ai_service.analyze_applications(applications)
    return InsightResponse(insight=insight, applications_analyzed=len(applications))


@router.post("/cover-letter", response_model=CoverLetterResponse)
def cover_letter(
    data: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
):
    content = ai_service.generate_cover_letter(data.company_name, data.role, data.skills)
    return CoverLetterResponse(content=content)


@router.post("/interview-prep", response_model=InterviewPrepResponse)
def interview_prep(
    data: InterviewPrepRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_name, role = data.company_name, data.role
    status = notes = None

    if data.application_id is not None:
        # get_owned_application 404s if it isn't this user's row, so one user
        # can't prep off another user's application.
        application = application_service.get_owned_application(
            db, data.application_id, current_user
        )
        # Explicit company/role in the body still win — lets you ask about the
        # same application under a different job title.
        company_name = company_name or application.company_name
        role = role or application.role
        status = application.status.value
        notes = application.notes

    prep = ai_service.generate_interview_prep(company_name, role, status, notes)
    return InterviewPrepResponse(company_name=company_name, role=role, prep=prep)
