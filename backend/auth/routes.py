from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import RedirectResponse

from app.config import Config
from app.caching import redis_cache

from auth.manager import fastapi_users, auth_backend, current_active_user, optional_current_user
from auth.models import User, UserVerification
from auth.schemas import UserCreate, UserRead
from auth.mailbots import send_verification_msg

from drylib import ok_response

from jigsaw.schemas import UserInfo
from jigsaw.tasks import bgt_make_cellprofile

from app.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

router.include_router(
    fastapi_users.get_auth_router(auth_backend), prefix="/jwt", tags=["auth"]
)
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    tags=["auth"],
)
# router.include_router(
#     fastapi_users.get_reset_password_router(),
#     tags=["auth"],
# )
# router.include_router(
#     fastapi_users.get_verify_router(UserRead),
#     tags=["auth"],
# )


# @router.get("/authenticated")
# async def authenticated_route(user: User = Depends(current_active_user)):
#     return {"message": f"Hello {user.email}! {str(current_active_user)}"}


@router.post("/verify-me")
async def send_verification_mail(user: User = Depends(current_active_user)):
    if user.is_verified:
        return ok_response("Email is verified. Please refresh the page.")
    check_last_sent = "VM_SENT_" + str(user.id)
    entry_exists = await redis_cache.get(check_last_sent)

    if entry_exists:
        return ok_response("-Try again after a few seconds")

    await redis_cache.set(check_last_sent, 1, ex=30)
    await send_verification_msg(user)
    return ok_response("Check your inbox")


@router.get("/verify-me/{secret}")
async def verify_email(secret: str, background_tasks: BackgroundTasks):
    uv = await UserVerification.find(UserVerification.secret == secret).first_or_none()
    if not uv:
        return {"message": "Invalid secret"}
    user_id = uv.user_id
    user = await User.get(user_id)
    user.is_verified = True

    await user.save()
    await uv.delete()

    background_tasks.add_task(bgt_make_cellprofile, user_id=user_id)
    logger.info(f"User {user.email} verified.")

    response = RedirectResponse(url=Config.UI_URL)
    return response


@router.get("/me", response_model=UserInfo)
async def get_current_user(user: User = Depends(current_active_user)):
    return {
        "id": user.id,
        "email": user.email,
        "is_verified": user.is_verified
    }
