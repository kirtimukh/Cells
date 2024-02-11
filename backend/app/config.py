import os
from dotenv import load_dotenv

env = load_dotenv()


class Config:
    DEV_MODE = os.getenv("DEV_MODE", False)

    SECRET_KEY = os.getenv("SECRET_KEY", "thisisn`tgoodbye,you`realwayshere.!")

    API_URL = os.getenv("API_URL", "http://localhost:8000")
    UI_URL = os.getenv("UI_URL", "http://localhost:3000")

    REDIS_AUTH_HOST = os.getenv("REDIS_AUTH_HOST", "redis://localhost:6379")
    REDIS_HOST = os.getenv("REDIS_HOST", "redis://localhost")
    REDIS_PORT = os.getenv("REDIS_PORT", 6379)

    MONGO_HOST = os.getenv("MONGO_HOST", "cluster0.teppelin.mongodb.net")
    MONGO_USER = os.getenv("MONGO_USER", "ragann")
    MONGO_PASS = os.getenv("MONGO_PASS", "let`sseeyougritthoseteeth!")
    MONGO_CONN = f"mongodb+srv://{MONGO_USER}:{MONGO_PASS}@{MONGO_HOST}"

    NULLDB = os.getenv("NULLDB", "mongodb")

    CELL_BUCKET = os.getenv("CELL_BUCKET")
    CELL_BUCKET_URL = os.getenv("CELL_BUCKET_URL", "")
    BIN_BUCKET = os.getenv("BIN_BUCKET")
    BIN_BUCKET_URL = os.getenv("BIN_BUCKET_URL")

    EMAIL_LOGIN = os.getenv("EMAIL_LOGIN")
    EMAIL_FROM = os.getenv("EMAIL_FROM")
    EMAIL_PASS = os.getenv("EMAIL_PASS")

    S3_PRESIGNED_POST_TIMEOUT = 10  # secs

    AWS_LAMBDA_URL = os.getenv("AWS_LAMBDA_URL")
    AWS_SQS_URL = os.getenv("AWS_SQS_URL")
