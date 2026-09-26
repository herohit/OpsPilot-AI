from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
from shopflow import log as logger_module
load_dotenv()

logger = logger_module.get_logger(logger_name="shopflow.database")

SQLALCHEMY_DATABASE_URL = os.getenv("POSTGRESS_URI")

DATABASE_URL = os.getenv("SQL_URI")

engine = create_engine(DATABASE_URL,connect_args={'check_same_thread':False})
logger.info("Database engine configured")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()