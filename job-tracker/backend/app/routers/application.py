from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user   # wherever your dependency lives
from app.schemas.application import ApplicationCreate, ApplicationResponse
from app.services import application_service

router = APIRouter(prefix="/applications", tags=["applications"])

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application( data: ApplicationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return application_service.create_application(db, data, current_user.id)


@router.get("", response_model=list[ApplicationResponse])
def list_applications( db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return application_service.list_applications(db, current_user.id)