from app.schemas.application import ApplicationCreate
from app.models.application import JobApplication
from sqlalchemy.orm import Session 
def create_application(db : Session , data: ApplicationCreate , userid : int) ->JobApplication:
    application = JobApplication(
        user_id = userid  # from the JWT, never the request body    
        company_name = data.company_name
        role = data.role
        job_url = str(data.job_link) if data.job_link else None,  # HttpUrl -> str  
        status = ApplicationStatus.APPLIED
        date_applied = data.date_applied
        interview_date = data.interview_date
        notes = data.notes
    )
    db.add(application)
    db.commit()
    db.refresh(application)   # reloads id, created_at, etc. from DB
    return application

