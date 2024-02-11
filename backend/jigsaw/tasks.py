import json
from drylib import repeat_every

from app.wsmanager import wsmanager
from jigsaw.models import CellProfile

from app.logger import get_logger


logger = get_logger(__name__)


async def bgt_make_cellprofile(user_id: str):
    logger.info(f"Creating CellProfile for user {user_id}")
    cp = await CellProfile.find_one(CellProfile.user_id==user_id)
    cp.credits += 50
    await cp.save()
    await wsmanager.send_message(user_id, json.dumps({
        "ok": True,
        "topic": "evcomplete",
        "message": "Email verified",
        "details": {}})
    )


@repeat_every(seconds=5, max_repetitions=0)
async def reg_update_profile_limits():
    """Add missing profiles for all users."""
    logger.info("Updating profile limits")
    # await CellProfile.find(CellProfile.available_uploads < 5).update_many(
    #     {"$set": {CellProfile.available_uploads: 5}}
    # )
