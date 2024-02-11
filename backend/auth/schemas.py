from beanie import BeanieObjectId
from fastapi_users import schemas
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Generic
from fastapi_users import models


# Schemas; for FastAPI to use to validate IO
class UserRead(schemas.BaseUser[BeanieObjectId]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass


class UserSelfRead(BaseModel, Generic[models.ID]):
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)
