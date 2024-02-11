import certifi

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from auth.models import User, UserVerification
from jigsaw.models import CellProfile, Image, Jigsaw, Shareable, Snapshot

from app.config import Config
from app.logger import get_logger


logger = get_logger(__name__)

document_models = [User, CellProfile, Image, Jigsaw, Shareable, Snapshot, UserVerification]
db_client = AsyncIOMotorClient(Config.MONGO_CONN, tlsCAFile=certifi.where())
nulldb = db_client[Config.NULLDB]


async def init_database():
    await init_beanie(
        database=nulldb,
        document_models=document_models,
    )
    logger.info("Initialised database")
