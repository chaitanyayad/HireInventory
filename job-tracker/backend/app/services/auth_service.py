import bcrypt
from app.models.user import User
from app.schemas.user import UserCreate
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta , timezone
from jose import jwt , JWTError
from app.config import settings
from app.database import get_db

# Knows how to pull the token out of the "Authorization: Bearer ..." header.
# tokenUrl is ONLY for the /docs "Authorize" button — it points at your login
# route, it does not create it
Bearer_Extracter = HTTPBearer()

def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode() , salt).decode()

def verify_password(plain_password : str , hashed_password : str) ->bool:
    return bcrypt.checkpw(plain_password.encode() , hashed_password.encode())
"""
Inside checkpw()
yo byrcypt is neat it got that shit on

# Parse the stored bcrypt string
version = "2b"
cost = 12
salt = "u4B0L3M3M6S8hS7yLhQq6e"
original_hash = "BlnF0..."

# Hash the entered password again
new_hash = bcrypt_hash(
    password="hello123",
    salt=salt,
    cost=12
)

return new_hash == original_hash
but first obviosuly we will need to create an endpoint that fetches the hashed password from databse absed on the user_id 
and then we parse the hased password along with plain passwrod after encdign them to bytes to the verfy_passwrod call

"""

def get_user_by_email(db : Session , email : str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_User(db : Session , user_data : UserCreate) ->User:
    db_user = User(email = user_data.email , hashed_password = hash_password(user_data.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_access_token(data : dict ) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes = settings.JWT_Expiration_Time)
    to_encode.update({"exp" : expire})
    return jwt.encode(to_encode , settings.JWT_Secret_Key , algorithm = settings.JWT_Algorithm )# postional arguments can be passed as keyword not the other way around

def get_current_user(creds : HTTPAuthorizationCredentials = Depends(Bearer_Extracter ) , db : Session = Depends(get_db)) ->User :
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,  detail="Could not validate credentials",headers={"WWW-Authenticate": "Bearer"},
    )
    token = creds.credentials
    try:
        payload = jwt.decode(token , settings.JWT_Secret_Key , algorithms = [settings.JWT_Algorithm])#[] is used because multiple algos are allowed this helps library check whetehr the algo present in header should be allowed. Also jwt.decode() returns only the payload (claims), not the whole token
        user_identifier : str = payload.get("sub")
        if not user_identifier :
            raise credentials_exception
       
    except JWTError:
        raise credentials_exception
        # A valid token isn't enough — the user could have been deleted since it was
    # issued. Always confirm they still exist, and get fresh data while you're here.

    user = db.query(User).filter(User.id == user_identifier).first()
    if user is None :
        raise credentials_exception

    return user
    """

db is your SQLAlchemy database session.
user_data is a UserCreate Pydantic model, something like:
class UserCreate(BaseModel):
    email: str
    password: str
    -> User means this function returns a User SQLAlchemy model object.

Session is the class (blueprint) that defines an object responsible for managing interactions with the database, including using a database connection, tracking changes to ORM objects, and handling transactions.

db.add() does not insert anything into the database by itself. It merely marks the object as "pending." The actual INSERT happens when the session is flushed, which db.commit() does automatically (unless it has already been flushed earlier). That's why commit() is the step where the row is actually written to the database.
    """