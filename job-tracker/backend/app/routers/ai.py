from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.ai import InsightResponse
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
