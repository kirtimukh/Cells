from passlib.context import CryptContext
from typing import Optional, Union

import redis.asyncio

from fastapi import Depends, Request
from fastapi_users import (
    BaseUserManager,
    exceptions,
    schemas,
    models,
    FastAPIUsers,
)
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
    RedisStrategy,
)

from fastapi_users_db_beanie import ObjectIDIDMixin
from beanie import BeanieObjectId

from app.config import Config
from app.logger import get_logger
from auth.models import User, get_user_db
from auth.mailbots import send_verification_msg

from jigsaw.models import CellProfile
from jigsaw.utils import postSignupCPActivity


service_name = "auth"
logger = get_logger(service_name)

SECRET = Config.SECRET_KEY
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")
redis = redis.asyncio.from_url(Config.REDIS_AUTH_HOST, decode_responses=True, db=0)


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)


def get_redis_strategy() -> RedisStrategy:
    return RedisStrategy(redis, lifetime_seconds=3600 * 24 * 7)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_redis_strategy,
)


class UserManager(ObjectIDIDMixin, BaseUserManager[User, BeanieObjectId]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def create(
        self,
        user_create: schemas.UC,
        safe: bool = False,
        request: Optional[Request] = None,
    ) -> models.UP:
        """
        Create a user in database.

        Triggers the on_after_register handler on success.

        :param user_create: The UserCreate model to create.
        :param safe: If True, sensitive values like is_superuser or is_verified
        will be ignored during the creation, defaults to False.
        :param request: Optional FastAPI request that
        triggered the operation, defaults to None.
        :raises UserAlreadyExists: A user already exists with the same e-mail.
        :return: A new user.
        """
        await self.validate_password(user_create.password, user_create)

        pre_at, post_at = user_create.email.split('@')
        mail_id = pre_at.split('+')[0]
        user_create.email = mail_id+'@'+post_at

        existing_user = await self.user_db.get_by_email(user_create.email)
        if existing_user is not None:
            raise exceptions.UserAlreadyExists()

        user_dict = (
            user_create.create_update_dict()
            if safe
            else user_create.create_update_dict_superuser()
        )
        password = user_dict.pop("password")
        user_dict["hashed_password"] = self.password_helper.hash(password)

        created_user = await self.user_db.create(user_dict)

        await self.on_after_register(created_user, request)

        return created_user

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        logger.info(f"User {user.id} has registered.")
        await postSignupCPActivity(user)
        await send_verification_msg(user)

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        logger.info(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        logger.info(
            f"Verification requested for user {user.id}. Verification token: {token}"
        )

    async def validate_password(
        self, password: str, user: Union[schemas.UC, models.UP]
    ) -> None:
        if len(password) < 8: raise exceptions.InvalidPasswordException()
        return


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)


fastapi_users = FastAPIUsers[User, BeanieObjectId](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
optional_current_user = fastapi_users.current_user(optional=True)
verified_user = fastapi_users.current_user(active=True, verified=True)


TOKEN_PREFIX = "fastapi_users_token"


async def get_user_id_from_token(token: str):
    redis_key = f'{TOKEN_PREFIX}:{token}'
    user_id = await redis.get(redis_key)
    cp = await CellProfile.find_one(CellProfile.user_id==user_id)
    if not cp.ws_client_id:
        cp.ws_client_id = str(cp.user_id)
        await cp.save()
    return cp.ws_client_id
