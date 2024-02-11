from datetime import datetime
from beanie import BeanieObjectId

from app.s3 import post_to_sqs
from auth.models import User

from jigsaw.constants import VisibilityEnum, ShareableStatusEnum
from jigsaw.models import Jigsaw, Shareable, Snapshot, CellProfile
from jigsaw.schemas import JSchema

from rn_gen import autogen_name


async def make_shareable(
    jigsaw_id: str,
    groups: JSchema.GroupState,
    states: dict,
    user: User
):
    jigsaw = await Jigsaw.find_one(Jigsaw.id==BeanieObjectId(jigsaw_id))

    autoname = "AUTONAME"
    obj_with_name = 'OBJ_EXISTS'
    while obj_with_name is not None:
        autoname = autogen_name()
        obj_with_name = await Shareable.find_one(
            Shareable.title==autoname, Shareable.user_id==user.id
        )

    shareable = Shareable(
        title=autoname,
        user_id=user.id,

        image_id=jigsaw.image_id,
        jigsaw_id=jigsaw.id,
        image_title=jigsaw.image_title,
        jigsaw_title=jigsaw.title,

        is_unique=False,

        # adhoc setup
        status=ShareableStatusEnum.ACTIVE,
        do_activation=datetime.now()
    )
    await shareable.create()

    if groups and states:
        snapshot = Snapshot(
            user_id=user.id,
            image_id=jigsaw.image_id,
            jigsaw_id=jigsaw.id,
            states=states,
            groups=groups.model_dump(),
            is_shared=True,
            shareable_id=shareable.id
        )
        await snapshot.create()

    return True, '', str(shareable.id)


async def make_jigsaw(image, user, new_cells, jtype):
    jigsaw_id = BeanieObjectId()
    s3dir = f"jigsaw/{str(user.id)}/{jigsaw_id}"

    cp = await CellProfile.find_one(CellProfile.user_id == user.id)

    jigconfig = {
        'targetHt': new_cells.targetHt,
        'numRows': min(cp.maxdims, new_cells.numRows),
        'numCols': min(cp.maxdims, new_cells.numCols),
    }

    new_jigsaw = Jigsaw(
        _id=jigsaw_id,
        user_id=user.id,
        title=new_cells.title,
        image_id=image.id,
        image_title=image.title,
        jigconfig=jigconfig,
        s3dir=s3dir,
    )
    new_jigsaw.visibility = VisibilityEnum.CLOSED if jtype == 'playables' else VisibilityEnum.SHARED
    await new_jigsaw.create()

    if jtype == 'shareables':
        _ok, _, shareable_id = await make_shareable(jigsaw_id, None, None, user)

    jigconfig = {
        'js_user': str(user.id),
        'title': new_cells.title,
        'jigsaw_id': str(jigsaw_id),
        'targetht': new_cells.targetHt,
        'numrows': min(cp.maxdims, new_cells.numRows),
        'numcols': min(cp.maxdims, new_cells.numCols),
    }

    image_dir = "defaults" if image.visibility == VisibilityEnum.OPEN else str(user.id)
    image_key = f"images/{image_dir}/{str(image.id)}/uimage.png"

    data = {
        'image_key': image_key,
        'jigconfig': jigconfig,
        'jtype': jtype
    }

    a, b = await post_to_sqs(data)
    return True, ''


async def isSolutionCorrect(jigsaw, payload):
    solution = [tuple(row) for row in jigsaw.solution]
    evaluation = [tuple(row) for row in payload.evaluation]

    rnum = 0
    rotate_rnum = lambda cell: {"cid": cell["cid"], "rnum": (cell["rnum"] + 1) % 4}
    rotate_rnums = lambda matrix: [
        [rotate_rnum(cell) for cell in row] for row in matrix
    ]
    rotate_clockwise = lambda a: list(zip(*reversed(a)))
    # rotate_counter_clockwise = lambda a: list(zip(*a))[::-1]

    while rnum < 4:
        if evaluation == solution:
            return True, rnum
        evaluation = rotate_rnums(evaluation)
        evaluation = rotate_clockwise(evaluation)
        rnum += 1

    return False, 0


async def postSignupCPActivity(user):
    openjs = await Jigsaw.find(Jigsaw.visibility==VisibilityEnum.OPEN).to_list()
    for js in openjs:
        await make_shareable(str(js.id), None, None, user)
