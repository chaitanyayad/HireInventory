from sqlalchemy.orm import Session

from app.models.application import JobApplication, ApplicationStatus
from app.services import cache_service


def compute_stats(db: Session, user_id: int) -> dict:
    applications = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == user_id)
        .all()
    )
    total = len(applications)
    by_status = {status.value: 0 for status in ApplicationStatus}
    for application in applications:
        by_status[application.status.value] += 1

    responded = total - by_status[ApplicationStatus.APPLIED.value]
    response_rate = round((responded / total) * 100, 1) if total else 0.0

    return {
        "total": total,
        "by_status": by_status,
        "response_rate": response_rate,
    }


def get_stats(db: Session, user_id: int) -> dict:
    cached = cache_service.get_cached_stats(user_id)
    if cached is not None:
        return cached

    stats = compute_stats(db, user_id)
    cache_service.set_cached_stats(user_id, stats)
    return stats