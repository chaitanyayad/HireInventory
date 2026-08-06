from app.schemas.application import ApplicationCreate
from fastapi import HTTPException , status
from app.models.application import JobApplication, ApplicationStatus
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.application import StatusUpdate
from app.services import cache_service
from app.services import event_publisher
from app.websockets import broker
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

def list_all_applications(db: Session, user_id: int) -> list[JobApplication]:
    # No limit/offset — the AI insight analyzer needs the FULL history,
    # not just one page of it.
    return (
        db.query(JobApplication)
        .filter(JobApplication.user_id == user_id)
        .order_by(JobApplication.date_applied.desc())
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
    old_status = application.status # remember what it was BEFORE we change it, so the event can say "screening -> interview"
    application.status = statusUpdate.status
    db.commit()
    db.refresh(application)
    cache_service.invalidate_stats(current_user.id)
    # publish AFTER commit — never announce a change that isn't saved yet.
    # If RabbitMQ is down this logs a warning and moves on (fail-open).
    event_publisher.publish_status_change_event(
        application_id=str(application.id),
        user_id=str(current_user.id),
        user_email=current_user.email,
        company_name=application.company_name,
        role=application.role,
        old_status=old_status.value,
        new_status=application.status.value,
    )
    # Announce to any open browser tabs. Separate from the RabbitMQ publish on
    # purpose — that one is a durable queue for work that must happen exactly
    # once (the email); this one is a fire-and-forget broadcast for UI that is
    # only worth delivering if someone is actually looking. Also fail-open.
    broker.publish_event(
        {
            "event_type": "status_changed",
            "application_id": str(application.id),
            "user_id": str(current_user.id),
            "company_name": application.company_name,
            "role": application.role,
            "old_status": old_status.value,
            "new_status": application.status.value,
        }
    )
    return application


def delete_application(db: Session , application_id :int , current_user : User) ->None:
    application = get_owned_application(db, application_id, current_user)
    db.delete(application)
    db.commit()
    cache_service.invalidate_stats(current_user.id)
