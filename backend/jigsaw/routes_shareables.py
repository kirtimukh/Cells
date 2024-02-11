import os, json
from datetime import datetime

from beanie import BeanieObjectId
from beanie.operators import In

from fastapi import (
    APIRouter,
    Depends,
)

from app.logger import get_logger

from drylib import ok_response

from jigsaw.constants import JStatusEnum, ShareableStatusEnum
from jigsaw.models import Snapshot, Jigsaw, Shareable
from jigsaw.schemas import (
    OkResponse,
    SnapshotRead,
    JSchema,
    ShareableRead
)
from jigsaw.utils import isSolutionCorrect

from auth.models import User
from auth.manager import current_active_user, optional_current_user


router = APIRouter()
logger = get_logger(os.path.basename(__file__))


@router.get("/all", response_model=list[ShareableRead])
async def list_shareables(user: User = Depends(current_active_user)):
    shareables = await Shareable.find(Shareable.user_id == user.id).to_list()
    return shareables


@router.get("/{shareable_id}", response_model=SnapshotRead | OkResponse)
async def get_saved_cells(
    shareable_id: str, user: User = Depends(optional_current_user)
):
    """
    Get cells of shared jigsaw.
    If snapshot exists then return the snapshot else return the jigsaw_id for ui to fetch cells.
    """
    shareable = await Shareable.find(Shareable.id == BeanieObjectId(shareable_id)).first_or_none()
    if not shareable: return ok_response('-No shareables here')
    
    if shareable.status == ShareableStatusEnum.INACTIVE:
        return ok_response('-No shareables here')

    if not shareable.do_firstview:
        shareable.do_firstview = datetime.now()
        shareable.status = ShareableStatusEnum.VIEWED
        await shareable.save()

    snapshot = await Snapshot.find(Snapshot.shareable_id == BeanieObjectId(shareable_id), Snapshot.is_shared == True).first_or_none()
    if snapshot: return snapshot
    
    return ok_response(False, 'Fetch cells afresh', jigsaw_id=str(shareable.jigsaw_id))


@router.post("/{shareable_id}/change", response_model=OkResponse)
async def post_changes(shareable_id: str, payload: dict, user: User = Depends(current_active_user)):
    shareable = await Shareable.find_one(Shareable.id==BeanieObjectId(shareable_id), Shareable.user_id == user.id)
    if not shareable: return ok_response('-')

    moc = payload.get('message_of_completion')
    if moc and moc != shareable.message_of_completion:
        shareable.message_of_completion = moc
        await shareable.save()

    return ok_response()


@router.post("/{shareable_id}/verify")
async def verify_completion(
    shareable_id: str,
    payload: JSchema.Evaluation,
    user: User = Depends(optional_current_user),
):
    """Verify completion of a jigsaw."""
    shareable = await Shareable.get(shareable_id)
    jigsaw = await Jigsaw.get(shareable.jigsaw_id)
    solved, uprightNum = await isSolutionCorrect(jigsaw, payload)
    if solved:
        shareable.status = ShareableStatusEnum.COMPLETED
        shareable.do_completion = datetime.now()
        await shareable.save()
    return ok_response(solved=solved, uprightNum=uprightNum, sharedMessage=shareable.message_of_completion)


@router.post("/delete", response_model=OkResponse)
async def post_delete(payload: dict, user: User = Depends(current_active_user)):
    ids = [BeanieObjectId(id) for id in payload.get('ids', [])]
    await Snapshot.find(In(Snapshot.shareable_id, ids), Snapshot.user_id==user.id).delete()
    await Shareable.find(In(Shareable.id, ids), Shareable.user_id==user.id).delete()
    return ok_response()
