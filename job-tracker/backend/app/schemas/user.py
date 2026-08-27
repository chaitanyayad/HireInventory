from pydantic import BaseModel, EmailStr
from uuid import UUID

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    is_active: bool

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer" 



class UserUpdate(BaseModel):
    """Body for PATCH /auth/me. Only the email can change today."""
    email: EmailStr


class PasswordChange(BaseModel):
    """Body for POST /auth/me/password.

    The current password is required even though the caller is already
    authenticated: a stolen or borrowed session should not be enough to lock
    the real owner out of their account.
    """
    current_password: str
    new_password: str
