# backend/app/database.py
from sqlalchemy import create_engine, text
"""
The engine knows

username
password
host
database
driver

It is the connection manager.

Without an engine

SQLAlchemy doesn't know where your database lives.

Suppose you want raw SQL

SELECT * FROM users;

You write

text("SELECT * FROM users")

It tells SQLAlchemy

"This is raw SQL."
"""
from sqlalchemy.orm import sessionmaker, DeclarativeBase
"""

class User(Base):
    That Base comes from DeclarativeBase When you inherit class User(Base): SQLAlchemy understands This class represents a table.

    sessionmaker

is literally

a factory that creates Sessions.Imagine Engine is The database server.A Session is One conversation with the database.
Open DB

↓

Query

↓

Insert

↓

Update

↓

Close

One session.
"""
from app.config import settings

engine = create_engine(settings.DATABASE_URL) #fetch database url from env file and pass it to create_engine to connect to database

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) #bind = which engine should session use to talk to the database
# automocommit = False means you have to commit changes manually by db.commit() after making changes to the database
class Base(DeclarativeBase):
    pass
#why make another Base class that inherits from DeclarativeBase? Because we want to use Base as the base class for our models. When we define a model, we will inherit from Base, which will give us access to all the functionality of SQLAlchemy's ORM.
# Dependency — used in route handlers later
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()