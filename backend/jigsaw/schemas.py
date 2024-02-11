from datetime import datetime
from typing import Optional
from pydantic import BaseModel, root_validator, Extra
from beanie import BeanieObjectId


class JigsawListItem(BaseModel):
    id: BeanieObjectId
    image_id: BeanieObjectId
    image_title: str
    title: str
    visibility: str
    numRows: int = None
    numCols: int = None

    @root_validator(pre=True)
    def get_shape(cls, obj):
        numRows = obj.jigconfig['numRows']
        numCols = obj.jigconfig['numCols']
        return {
            'numRows': numRows,
            'numCols': numCols
        } | dict(obj)


class JigsawRead(BaseModel):
    title: str
    cellblocks: list = []
    cmeta: dict = {}
    s3dir: str = ""


class JSGroupState(BaseModel):
    c2g: dict
    g2c: dict
    singleCells: list


class SnapshotRead(BaseModel):
    id: BeanieObjectId
    jigsaw_id: BeanieObjectId
    groups: JSGroupState
    states: dict
    ok: bool = True


class ShareableRead(BaseModel):
    id: BeanieObjectId
    title: str
    # image_id: BeanieObjectId
    # jigsaw_id: BeanieObjectId
    image_title: str
    message_of_completion: str

    is_unique: bool = True
    do_activation: Optional[datetime] = None  # date of activation
    do_firstview: Optional[datetime] = None  # date of first view
    do_checkin: Optional[datetime] = None  # date of last save
    do_completion: Optional[datetime] = None  # date of completion
    expires_in: int

    status: str


class NewJigsawConfig(BaseModel):
    numCols: int
    numRows: int
    targetHt: int
    title: str
    imgWidth: int = None
    imgHeight: int = None


class CreateImage(BaseModel):
    _id: BeanieObjectId
    filename: str


class OkResponse(BaseModel):
    ok: bool = True
    message: str = ""

    class Config:
        extra = Extra.allow


class JigsawEvaluation(BaseModel):
    evaluation: list


class CellProfileRead(BaseModel):
    is_verified: bool
    credits: int
    images: int
    jigsaws: int
    shares: int


class UserInfo(BaseModel):
    id: BeanieObjectId
    email: str
    is_verified: bool
    # cprofile: CellProfileRead


class JSchema:
    Evaluation = JigsawEvaluation
    ListItem = JigsawListItem
    Read = JigsawRead
    Config = NewJigsawConfig
    GroupState = JSGroupState
