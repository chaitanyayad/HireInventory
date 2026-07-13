from app.services import cache_service
from sqlalchemy.orm import Sessions 

from app.models.application import JobApplication
from app.models.application import ApplicationStatus

def compute_stats(db : Session  , userid : int ) -> dict:
    raw = db.query(JobApplication).filter(userid == User.user_id).all()
    total = len(raw)
    by_status = {status.value: 0 for status in ApplicationStatus}
    for app in apps:
        by_status[app.status.value] += 1

    responded = total - by_status[ApplicationStatus.APPLIED.value]
    response_rate = round((responded / total) * 100, 1) if total else 0.0

    return {
        "total": total,
        "by_status": by_status,
        "response_rate": response_rate,
    }