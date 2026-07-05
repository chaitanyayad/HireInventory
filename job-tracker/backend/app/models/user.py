import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True) # so that a user cannot use the same mail id to create 2 diff accounts
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # backref lets you do application.owner and get the user
    applications = relationship("JobApplication", back_populates="owner", cascade="all, delete")

    #modela and schema are different in the sennse that model is the database representation of the user and schema is the representation of the user in the API. The schema is used to validate the data that is sent to the API and to serialize the data that is sent back to the client. The model is used to interact with the database.