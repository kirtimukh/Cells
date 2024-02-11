import json, random
from datetime import datetime

from typing import Literal, Optional
from beanie import BeanieObjectId
from beanie.operators import In

from fastapi import (
    APIRouter,
    Depends,
)

from app.config import Config as AppConfig
from app.logger import get_logger
from app.s3 import get_and_read_s3_object
from app.wsmanager import wsmanager

from drylib import ok_response

from jigsaw.constants import JStatusEnum, VisibilityEnum, MESSAGES_OF_COMPLETION
from jigsaw.models import Snapshot, Jigsaw, Shareable
from jigsaw.profiler import update_availability, check_eligibility
from jigsaw.schemas import (
    OkResponse,
    SnapshotRead,
    JSchema,
)
from jigsaw.utils import make_shareable, isSolutionCorrect
from jigsaw.constants import ShareableStatusEnum

from auth.models import User
from auth.manager import current_active_user, optional_current_user


router = APIRouter()
logger = get_logger("router.py")


@router.get("/all", response_model=list[JSchema.ListItem])
async def list_jigsaws(user: Optional[User] = Depends(optional_current_user)):
    openjs = await Jigsaw.find(Jigsaw.visibility == "open").to_list()
    closedjs = []
    if user is not None:
        closedjs = await Jigsaw.find(
            Jigsaw.user_id == user.id,
            Jigsaw.visibility == "closed",
            Jigsaw.status == JStatusEnum.READY,
        ).to_list()

    return closedjs + openjs


@router.post("/{jigsaw_id}/make-shareable")
async def make_shareable_from_jigsaw(
    jigsaw_id: str,
    groups: Optional[JSchema.GroupState] = None,
    states: Optional[dict] = None,
    user: User = Depends(current_active_user)
):
    jigsaw = await Jigsaw.find_one(Jigsaw.id==BeanieObjectId(jigsaw_id))
    
    is_eligible, message = await check_eligibility(user, jigsaw.image_id, 'clone_jigsaw')
    if not is_eligible: return False, message, ''

    ok, message, shareable_id = await make_shareable(jigsaw_id, groups, states, user)
    if ok: update_availability(str(user.id), 'clone_jigsaw')
    return ok_response(ok, message)


@router.get("/{jigsaw_id}/cells", response_model=JSchema.Read)
async def get_cells(
    jigsaw_id: str, user: Optional[User] = Depends(optional_current_user)
):
    """Get cells of a jigsaw."""
    jigsaw = await Jigsaw.get(jigsaw_id)
    return jigsaw


@router.post("/{jigsaw_id}/verify")
async def verify_completion(
    jigsaw_id: str,
    payload: JSchema.Evaluation,
    user: User = Depends(optional_current_user),
):
    """Verify completion of a jigsaw."""
    jigsaw = await Jigsaw.get(jigsaw_id)
    solved, uprightNum = await isSolutionCorrect(jigsaw, payload)
    return ok_response(solved=solved, uprightNum=uprightNum, sharedMessage=random.choice(MESSAGES_OF_COMPLETION))
    

@router.post("/{jigsaw_id}/{snapType}", response_model=OkResponse)
async def save_cells(
    jigsaw_id: str,
    groups: JSchema.GroupState,
    states: dict,
    snapType: str,
    user: User = Depends(optional_current_user),
):
    """Save cells of a jigsaw."""
    if snapType in ["snapshot", "makeShareable"] and not user:
        return ok_response('-Action not allowed')

    snapshot = None
    if snapType == "snapshot":
        snapshot = await Snapshot.find_one(
            Snapshot.user_id == BeanieObjectId(user.id), Snapshot.is_shared == False
        )
        if snapshot:
            snapshot.jigsaw_id = BeanieObjectId(jigsaw_id)
            snapshot.states = states
            snapshot.groups = groups.model_dump()
            await snapshot.save()
        else:
            jigsaw = await Jigsaw.get(jigsaw_id)
            if not (jigsaw.user_id == BeanieObjectId(user.id) or jigsaw.visibility == VisibilityEnum.OPEN or jigsaw.visibility == VisibilityEnum.OPEN.value):
                return ok_response('-Not allowed')

            snapshot = Snapshot(
                user_id=user.id,
                image_id=jigsaw.image_id,
                jigsaw_id=jigsaw_id,
                states=states,
                groups=groups.model_dump(),
            )
            await snapshot.create()

    elif snapType == "isShareable":
        shareable_id = BeanieObjectId(jigsaw_id)
        shareable = await Shareable.find_one(Shareable.id == shareable_id)
        snapshot = await Snapshot.find_one(Snapshot.shareable_id == shareable_id)

        if not snapshot:
            snapshot = Snapshot(
                user_id=user.id if user else None,
                image_id=shareable.image_id,
                jigsaw_id=shareable.jigsaw_id,
                is_shared=True,
                shareable_id=shareable_id,
            )
            await snapshot.create()

        shareable.do_checkin = datetime.now()
        shareable.status = ShareableStatusEnum.CHECKEDIN
        await shareable.save()
        snapshot.states = states
        snapshot.groups = groups.model_dump()
        await snapshot.save()

    elif snapType in ["makeShareable"]:
        jigsaw = await Jigsaw.find_one(Jigsaw.id==BeanieObjectId(jigsaw_id))

        is_eligible, message = await check_eligibility(user, jigsaw.image_id, 'clone_jigsaw')
        if not is_eligible: return False, message, ''

        ok, message, shareable_id = await make_shareable(jigsaw_id, groups, states, user)
        if ok: update_availability(str(user.id), 'clone_jigsaw')
        return ok_response(ok, message, shareableId=shareable_id)

    return ok_response()


@router.get("/snapshot/{snapshot_id}", response_model=SnapshotRead | OkResponse)
async def get_saved_cells(
    snapshot_id: str | Literal["last"], user: User = Depends(optional_current_user)
):
    """Get saved cells of a jigsaw."""
    if isinstance(snapshot_id, str) and snapshot_id == "last":
        snapshot = await Snapshot.find(
            Snapshot.user_id == user.id, Snapshot.is_shared == False
            ).sort('-created_at').first_or_none()
    else:
        result = await Snapshot.find(Snapshot.user_id == user.id).to_list()
        snapshot = result[-1].model_dump()

    if not snapshot:
        return ok_response("-No snapshot found")

    return snapshot


@router.post("/report")
async def s3_webhook(message: dict):
    info = message['info']
    dest = info["key"]

    logger.info(f"CellsFn ok: {message['success']}")

    if not message["success"]:
        jigsaw_id = info['jigsaw_id']
        await Jigsaw.find_one(Jigsaw.id == BeanieObjectId(jigsaw_id)).delete()
        logger.error(f"Upload failed: {json.dumps(message)}")
        return {"status": "error"}

    jigsaw_key = f"{dest}/jigsaw.json"
    jigsaw_dict = get_and_read_s3_object(AppConfig.CELL_BUCKET, jigsaw_key)
    jigsaw_id = jigsaw_dict["jigsaw_id"]

    assert jigsaw_id == dest.split("/")[2]

    jigsaw = await Jigsaw.get(jigsaw_id)

    jigsaw.cellblocks = jigsaw_dict["cellblocks"]

    cmeta = jigsaw_dict["cmeta"]
    cmeta["numRows"] = jigsaw.jigconfig["numRows"]
    cmeta["numCols"] = jigsaw.jigconfig["numCols"]
    jigsaw.cmeta = cmeta

    jigsaw.solution = jigsaw_dict["solution"]
    jigsaw.status = JStatusEnum.READY
    await jigsaw.save()

    await update_availability(jigsaw.user_id, info['tasktype'])
    await wsmanager.send_message(str(jigsaw.user_id), json.dumps({
        "ok": True,
        "topic": "newjigsaw",
        "message": "Jigsaw has been created",
        "details": {
            'id': str(jigsaw.id),
            'title': jigsaw.title,
            'visibility': jigsaw.visibility
        }})
    )

    return ok_response()


@router.post("/delete", response_model=OkResponse)
async def post_delete(payload: dict, user: User = Depends(current_active_user)):
    ids = [BeanieObjectId(id) for id in payload.get('ids', [])]
    await Snapshot.find(In(Snapshot.jigsaw_id, ids), Snapshot.user_id==BeanieObjectId(user.id)).delete()
    await Shareable.find(In(Shareable.jigsaw_id, ids), Shareable.user_id==BeanieObjectId(user.id)).delete()
    await Jigsaw.find(In(Jigsaw.id, ids), Jigsaw.user_id==user.id).delete()
    return ok_response()
