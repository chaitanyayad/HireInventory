import bycrypt
from app.models import User
from app.schmemas import UserCreate
from sqlalchemy.orm import Session

def hash_password(plain_password: str) -> str:
    salt = bycrypt.gensalt()
    return bycrypt.hashpw(plain_password.encode() , salt).decode()

def verify_password(plain_password : str , hashed_password : str) ->bool
    return bycrypt.checkpw(plain_password.encode() , hashed_password.encode())
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

def get_user_by_email(db : session , email : str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_User(db : Session , user_data : UserCreate) ->User
    db_user = User(email = user_data.email , hashed_password = hash_password(user_data.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

    """

db is your SQLAlchemy database session.
user_data is a UserCreate Pydantic model, something like:
class UserCreate(BaseModel):
    email: str
    password: str
    -> User means this function returns a User SQLAlchemy model object.

db.add() does not insert anything into the database by itself. It merely marks the object as "pending." The actual INSERT happens when the session is flushed, which db.commit() does automatically (unless it has already been flushed earlier). That's why commit() is the step where the row is actually written to the database.
    """