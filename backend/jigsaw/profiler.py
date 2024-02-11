from beanie import BeanieObjectId

from jigsaw.models import CellProfile, Image
from jigsaw.constants import VisibilityEnum
from jigsaw.schemas import CellProfileRead

from app.caching import redis_cache
from app.logger import get_logger

from fastapi import (
    APIRouter,
    Depends,
)
from auth.models import User
from auth.manager import current_active_user, optional_current_user

from drylib import ok_response

router = APIRouter()
logger = get_logger(__name__)


PRICELIST = {
    'clone_jigsaw': 2,
    'create_jigsaw': 5,
    'upload_image': 5
}


async def is_upload_allowed(user_id: BeanieObjectId) -> bool:
    """Check if user is allowed to upload."""
    user_uploaded_recently_key = "IMAGE_UPLOADED_BY_" + str(user_id)
    user_uploaded_recently_value = await redis_cache.get(user_uploaded_recently_key)

    if user_uploaded_recently_value is not None:
        return False, "Previous attempt is too recent"

    cp = await CellProfile.find_one(CellProfile.user_id == user_id)
    if cp.credits < PRICELIST['upload_image']:
        return False, "Not enough credits"

    return True, ""


async def is_upload_too_recent(user_id: BeanieObjectId) -> bool:
    user_uploaded_recently_key = "IMAGE_UPLOADED_BY_" + str(user_id)
    user_uploaded_recently_value = await redis_cache.get(user_uploaded_recently_key)

    if user_uploaded_recently_value is not None:
        return False


async def check_eligibility(user, image_id, tasktype):
    if tasktype == 'upload_image' and not user.is_verified:
        return False, "Verified emails only"

    cp = await CellProfile.find_one(CellProfile.user_id == user.id)
    if cp.credits < PRICELIST[tasktype]: return False, "Not enough credits for this action"

    yes = await is_upload_too_recent(user.id)
    if yes: return False, "Previous attempt is too recent"

    if tasktype != "upload_image":
        image = await Image.find_one(Image.id==BeanieObjectId(image_id))
        if image.user_id != user.id and image.visibility != VisibilityEnum.OPEN:
            return False, "Action not allowed"
    
    return True, ""


async def update_availability(user_id: str, tasktype):
    cp = await CellProfile.find_one(CellProfile.user_id == user_id)
    opcost = 2
    if tasktype == 'uploaded_image': opcost = PRICELIST['upload_image']
    elif tasktype == 'existing_image': opcost = PRICELIST['create_jigsaw']
    cp.credits -= opcost
    await cp.save()


@router.get('/', response_model=CellProfileRead)
async def profileInfo(user: User = Depends(current_active_user)):
    cp = await CellProfile.find_one(CellProfile.user_id == user.id)
    if not cp:
        cp = CellProfile(user_id=user.id)
        await cp.create()
    cp_dict = cp.model_dump()  # or cp.model_dump() if using Pydantic v2
    cp_dict["is_verified"] = user.is_verified
    return cp_dict


@router.post('/buy-credits')
async def buyCredits(payload: dict, user: User = Depends(current_active_user)):
    cp = await CellProfile.find_one(CellProfile.user_id == user.id)

    if payload['haveInterest']:
        cp.ywtp_count += 1
        cp.willing_to_pay = True
    else: cp.nwtp_count += 1
    await cp.save()

    return ok_response()
