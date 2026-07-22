from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse , Token , UserLogin
from app.services.auth_service import create_User, get_user_by_email , create_access_token , verify_password , get_current_user
from app.dependencies.rate_limit import rate_limit

"""

# FastAPI Authentication Flow: Summary of My Doubts and Their Answers

## 1. SQLAlchemy Object Creation

### Code

```python
db_user = User(
    email=user_data.email,
    hashed_password=hash_password(user_data.password)
)
```

### Understanding

* `User(...)` creates a **Python object (instance)** of the SQLAlchemy `User` class.
* At this point, **nothing has been written to the database**.
* The object only exists in RAM.

Flow:

```
User(...)  → Python object
db.add()   → SQLAlchemy starts tracking it
db.commit()→ INSERT query executed
db.refresh() → Object updated with database values
```

---

## 2. Purpose of `UserCreate`

```python
class UserCreate(BaseModel):
    email: EmailStr
    password: str
```

### Why have this class?

It represents **data coming from the client**.

It should only contain fields the client is allowed to send.

Contains:

* email
* password

Does NOT contain:

* id
* hashed_password
* created_at
* is_active

because those are controlled by the server/database.

---

## 3. Purpose of the SQLAlchemy `User` Model

```python
class User(Base):
```

This represents **one row in the database**.

It contains:

* id
* email
* hashed_password
* created_at
* is_active

Unlike `UserCreate`, this is concerned with database storage.

---

## 4. Why Not Pass Every Field as Function Parameters?

Instead of

```python
def create_user(
    db,
    email,
    password,
    id,
    created_at,
    is_active
):
```

we use

```python
def create_user(db, user_data: UserCreate)
```

Reasons:

* fewer parameters
* cleaner code
* easier to maintain
* adding new fields only requires updating `UserCreate`
* groups related data into one object

---

## 5. Thinking Like a Software Engineer

Questions to ask while designing:

### What is this object's responsibility?

Example:

`UserCreate`
→ accepts client input

`User`
→ represents a database row

---

### Who should know this information?

| Field           | Owner    |
| --------------- | -------- |
| email           | Client   |
| password        | Client   |
| hashed_password | Server   |
| id              | Database |
| created_at      | Database |
| is_active       | Server   |

---

### What changes together?

If several values always travel together, they probably belong inside one class.

---

## 6. Why `APIRouter` Instead of `FastAPI`?

`FastAPI()`

Creates the **entire application**.

`APIRouter()`

Creates a **group of routes**.

Example:

```
FastAPI App
│
├── Auth Router
├── User Router
├── Job Router
```

Later all routers are attached using

```python
app.include_router(...)
```

---

## 7. Understanding

```python
router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)
```

### prefix="/auth"

Automatically adds

```
/auth
```

to every endpoint.

Example

```python
@router.post("/register")
```

becomes

```
POST /auth/register
```

---

### tags=["auth"]

Used only for Swagger/OpenAPI documentation.

Groups endpoints together under the "Auth" section.

---

## 8. Understanding

```python
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201
)
```

### This decorator tells FastAPI:

* register this function as a POST endpoint
* URL is `/register`
* successful response code is 201
* response should match `UserResponse`

---

## 9. What Does `response_model` Do?

It is **not just a type hint**.

It tells FastAPI to:

* validate the response
* convert objects into a Pydantic model
* remove unwanted fields
* generate API documentation

Example

Database object:

```
id
email
hashed_password
created_at
is_active
```

Response sent:

```
id
email
created_at
is_active
```

The password hash is automatically removed.

---

## 10. Difference Between

```python
-> UserResponse
```

and

```python
response_model=UserResponse
```

### `-> UserResponse`

Python type hint.

Helps:

* IDE
* autocomplete
* static type checkers
* developers

Python does not enforce it.

---

### `response_model`

FastAPI runtime feature.

Actually controls:

* validation
* serialization
* filtering
* API docs

---

## 11. Could I Manually Create a `UserResponse`?

Yes.

Example

```python
return UserResponse(
    id=user.id,
    email=user.email,
    is_active=user.is_active,
    created_at=user.created_at,
)
```

This is perfectly valid.

`response_model` simply automates this conversion and adds validation.

---

## 12. Why `db_user.id` Instead of `User.id`?

`User`

The class (blueprint).

`db_user`

An object (instance) of that class.

Example

```python
db_user = User(...)
```

Then

```python
db_user.email
```

works.

But

```python
User.email
```

inside normal Python code is **not** the email value.

It refers to the SQLAlchemy column definition.

---

## 13. Variable Names

Python only knows the names you create.

If you write

```python
db_user = User(...)
```

then

```python
db_user.email
```

works.

But

```python
user.email
```

raises

```
NameError
```

because no variable named `user` exists.

The object doesn't care about its variable name.

These are all equivalent:

```python
db_user = User(...)
```

```python
user = User(...)
```

```python
banana = User(...)
```

Only the variable name changes.

---

## 14. Complete Registration Flow

```
Client sends JSON
        │
        ▼
FastAPI validates request
        │
        ▼
UserCreate
        │
        ▼
register()
        │
        ▼
get_user_by_email()
        │
        ▼
create_user()
        │
        ▼
User (SQLAlchemy object)
        │
        ▼
db.add()
        │
        ▼
db.commit()
        │
        ▼
Database row created
        │
        ▼
FastAPI converts User
into UserResponse
(using response_model)
        │
        ▼
JSON sent back to client
```

## Biggest Takeaway

A typical FastAPI backend has three layers:

* **Pydantic models** define what enters and leaves your API.
* **SQLAlchemy models** define what is stored in the database.
* **Route functions and services** transform data between those two worlds while applying business logic.
"""

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
    dependencies=[Depends(rate_limit("auth_register", limit=5))],
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_User(db, user_data)


@router.post(
    "/login",
    response_model=Token,
    status_code=200,
    dependencies=[Depends(rate_limit("auth_login"))],
)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, credentials.email)
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=token)


@router.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email}
