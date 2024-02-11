from datetime import datetime, timedelta
from typing import Optional

from beanie import BeanieObjectId
from bson import ObjectId
from pydantic import computed_field, Field
from typing import Optional

from drylib import BaseDocument
from jigsaw.constants import (
    JStatusEnum,
    ShareableStatusEnum,
    VisibilityEnum,
    DEFAULT_SHAREABLE_TTL
)


class ObjectIdStr(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, value):
        if not ObjectId.is_valid(value):
            raise ValueError(f"'{value}' is not a valid ObjectId")
        return str(value)


class Snapshot(BaseDocument):
    user_id: BeanieObjectId
    image_id: BeanieObjectId
    jigsaw_id: BeanieObjectId

    states: Optional[dict] = None
    groups: Optional[dict] = None

    is_shared: bool = False
    shareable_id: BeanieObjectId = None

    class Settings:
        name = "Snapshot"


class Shareable(BaseDocument):
    title: str
    user_id: BeanieObjectId
    image_id: BeanieObjectId
    jigsaw_id: BeanieObjectId
    image_title: str
    jigsaw_title: str

    message_of_completion: str = 'The pieces have assembled.'

    is_unique: bool = True
    do_creation: datetime = Field(default_factory=datetime.now)
    do_activation: Optional[datetime] = None  # date of activation
    do_firstview: Optional[datetime] = None  # date of first view
    do_checkin: Optional[datetime] = None  # date of last save
    do_completion: Optional[datetime] = None  # date of completion
    expires_in: int = DEFAULT_SHAREABLE_TTL

    status: str = ShareableStatusEnum.INACTIVE

    @computed_field
    @property
    def expires_at(self) -> datetime:
        return datetime.now() + timedelta(hours=self.expires_in) 

    class Settings:
        name = "Shareable"


class Image(BaseDocument):
    user_id: BeanieObjectId
    title: str
    width: int
    height: int
    visibility: VisibilityEnum = VisibilityEnum.CLOSED

    class Settings:
        name = "Image"


class Jigsaw(BaseDocument):
    user_id: BeanieObjectId
    image_id: BeanieObjectId
    image_title: str
    title: str
    jigconfig: dict
    cellblocks: list = []
    cmeta: dict = {}
    solution: list = []
    visibility: str = VisibilityEnum.CLOSED
    s3dir: str = ""
    status: JStatusEnum = JStatusEnum.NO_FILE

    class Settings:
        name = "Jigsaw"


class CellProfile(BaseDocument):
    user_id: BeanieObjectId
    ws_client_id: Optional[str | None] = None
    maxdims: int = 5
    credits: int = 20
    images: int = 0
    jigsaws: int = 0
    shares: int = 0
    willing_to_pay: bool = False
    ywtp_count: int = 0
    nwtp_count: int = 0
