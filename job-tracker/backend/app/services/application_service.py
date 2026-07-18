from app.schemas.application import ApplicationCreate
from fastapi import HTTPException , status
from app.models.application import JobApplication, ApplicationStatus
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.application import StatusUpdate
from app.services import cache_service
def create_application(db : Session , data: ApplicationCreate , userid : int) ->JobApplication:
    application = JobApplication(
        user_id = userid,  # from the JWT, never the request body    
        company_name = data.company_name,
        role = data.role,
        job_url = str(data.job_link) if data.job_link else None,  # HttpUrl -> str  
        status = ApplicationStatus.APPLIED,
        date_applied = data.date_applied,
        interview_date = data.interview_date,
        notes = data.notes,
    )
    db.add(application)
    db.commit()
    db.refresh(application)   # reloads id, created_at, etc. from DB
    cache_service.invalidate_stats(userid)
    return application

def list_applications(db: Session, user_id: int, limit: int = 50, offset: int = 0) -> list[JobApplication]:# limit fetches only a sppecific no of applicartions and offset skips those this helps in pagination when user clicks nextpage oddfet is set to 30 so it skips frist 30 applications and fetches nexxt 30
    return (
        db.query(JobApplication)
        .filter(JobApplication.user_id == user_id)   # only THIS user's rows
        .order_by(JobApplication.date_applied.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

#fetch an application and confirm whethre the current user owns it so no one can update or delete other users applciations
def get_owned_application(db : Session , application_id :int , current_user :  User ) ->JobApplication :
    application = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id)
        .first()
    )
    if application is None or application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    return application


def update_application_status(db :Session , application_id : int , statusUpdate : StatusUpdate , current_user :  User) ->JobApplication:
    application = get_owned_application(db, application_id, current_user)
    application.status = statusUpdate.status
    db.commit()
    db.refresh(application)
    cache_service.invalidate_stats(current_user.id)
    return application


def delete_application(db: Session , application_id :int , current_user : User) ->None:
    application = get_owned_application(db, application_id, current_user)
    db.delete(application)
    db.commit()
    cache_service.invalidate_stats(current_user.id)
