import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class ApplicationStatus(enum.Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    company_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    job_url = Column(String, nullable=True)
    status = Column(SAEnum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False)
    date_applied = Column(Date, nullable=False)
    interview_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="applications")