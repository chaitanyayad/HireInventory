from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import JobApplication
from app.models.user import User
from app.routers.auth import get_current_user   # wherever your dependency lives
from app.schemas.application import ApplicationCreate, ApplicationResponse , StatusUpdate
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

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(application_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> JobApplication:
    # Lets the detail page deep-link. get_owned_application already 404s on
    # someone else's row, so this leaks nothing the list didn't already.
    return application_service.get_owned_application(db, application_id, current_user)


@router.patch("/{application_id}/status" , response_model = ApplicationResponse , status_code = 200)
def update_application(application_id: UUID, status_update: StatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> JobApplication:
    return application_service.update_application_status(db, application_id, status_update, current_user)

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(application_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    application_service.delete_application(db, application_id, current_user)
