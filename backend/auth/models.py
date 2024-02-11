from datetime import datetime, timedelta
from pydantic import Field

from beanie import BeanieObjectId, Document
from fastapi_users.db import BeanieBaseUser, BeanieUserDatabase

from auth.constants import UVModeEnum, UVStatusEnum
from drylib import BaseDocument


class User(BeanieBaseUser, Document):
    pass


def get_expiry(starttime: datetime = None, expires_after: int = 6):
    if not starttime:
        starttime = datetime.now()
    return starttime + timedelta(hours=expires_after)


class UserVerification(BaseDocument):
    user_id: BeanieObjectId
    mode: UVModeEnum = UVModeEnum.EMAIL
    status: UVStatusEnum = UVStatusEnum.SENT
    secret: str
    expires_at: datetime = Field(default_factory=get_expiry)


async def get_user_db():
    yield BeanieUserDatabase(User)
