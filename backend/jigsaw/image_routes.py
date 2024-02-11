from fastapi import APIRouter, Depends
from beanie import BeanieObjectId

from app.caching import redis_cache
from app.config import Config as AppConfig
from app.logger import get_logger
from app.s3 import (
    get_thumbnail_url,
    generate_presigned_post,
    delete_image_from_s3,
    post_to_sqs
)

from jigsaw.constants import VisibilityEnum
from jigsaw.models import Image, Jigsaw, Shareable, Snapshot, CellProfile
from jigsaw.profiler import check_eligibility
from jigsaw.schemas import JSchema
from jigsaw.utils import make_jigsaw

from auth.models import User
from auth.manager import current_active_user

from drylib import ok_response


router = APIRouter()
logger = get_logger("image_routes.py")


@router.post("/new-image")
async def upload_image_and_create_jigsaw(
    new_cells: JSchema.Config,
    user: User = Depends(current_active_user),
):
    cp = await CellProfile.find_one(CellProfile.user_id == user.id)

    jigconfig = {
        'js_user': str(user.id),
        'targetHt': new_cells.targetHt,
        'numRows': min(cp.maxdims, new_cells.numRows),
        'numCols': min(cp.maxdims, new_cells.numCols)
    }

    ok, message = await check_eligibility(user, None, 'upload_image')
    if not ok:
        return ok_response(False, message)

    if user.is_superuser:
        image_dir = "defaults"
        visibility = VisibilityEnum.OPEN
    else:
        image_dir = str(user.id)
        visibility = VisibilityEnum.CLOSED

    new_image = Image(
        user_id=user.id,
        title=new_cells.title,
        visibility=visibility,
        width=new_cells.imgWidth,
        height=new_cells.imgHeight
    )

    jigsaw_id = BeanieObjectId()
    s3dir = f"jigsaw/{image_dir}/{jigsaw_id}"
    await new_image.create()
    new_jigsaw = Jigsaw(
        _id=jigsaw_id,
        user_id=user.id,
        title=new_cells.title,
        image_id=new_image.id,
        image_title=new_image.title,
        jigconfig=jigconfig,
        visibility=visibility,
        s3dir=s3dir,
    )
    await new_jigsaw.create()
    jigconfig['js_user'] = image_dir
    jigconfig["jigsaw_id"] = str(jigsaw_id)

    presigned_url = generate_presigned_post(
        f"images/{image_dir}/{new_image.id}/uimage.png", jigconfig
    )
    user_uploaded_recently_key = "IMAGE_UPLOADED_BY_" + str(user.id)
    await redis_cache.set(user_uploaded_recently_key, 1, ex=AppConfig.S3_PRESIGNED_POST_TIMEOUT)

    return ok_response(presignedS3Url=presigned_url)


@router.post("/new-{jtype}/{image_id}")
async def create_jigsaw_from_existing_image(
    jtype: str,
    image_id: str,
    new_cells: JSchema.Config,
    user: User = Depends(current_active_user),
):
    ok, message = await check_eligibility(user, image_id, 'create_jigsaw')
    if not ok: return ok_response(ok, message)
    
    image = await Image.find_one(Image.id==BeanieObjectId(image_id))
    ok, message = await make_jigsaw(image, user, new_cells, jtype)
    return ok_response(ok, message)


@router.get("/all")
async def list_images(user: User = Depends(current_active_user)):
    openimages = await Image.find(Image.visibility == VisibilityEnum.OPEN).to_list()
    closedimages = await Image.find(
        Image.user_id == user.id,
        Image.visibility == VisibilityEnum.CLOSED
        ).to_list()

    result = []

    for image in openimages + closedimages:
        uid = str(user.id)
        if image.visibility == VisibilityEnum.OPEN:
            uid = "defaults"

        # purl = await get_image_url(uid, image.id)
        turl = get_thumbnail_url(uid, image.id)
        result.append({
            'imageid': str(image.id),
            'title': image.title,
            # 'image_url': purl,
            'thumbnail_url': turl,
            'imgWidth': image.width,
            'imgHeight': image.height
            })

    return result


@router.post("/{image_id}/delete")
async def delete_image_and_jigsaw(image_id: str, user: User = Depends(current_active_user)):
    user_dir = str(user.id)
    if user.is_superuser:
        user_dir = "defaults"

    image_dir = f"images/{user_dir}/{image_id}"

    delete_image_from_s3(AppConfig.CELL_BUCKET, image_dir)
    await Snapshot.find(Snapshot.image_id==BeanieObjectId(image_id), Snapshot.user_id==BeanieObjectId(user.id)).delete()
    await Shareable.find(Shareable.image_id==BeanieObjectId(image_id), Shareable.user_id==BeanieObjectId(user.id)).delete()
    await Jigsaw.find(Jigsaw.image_id==BeanieObjectId(image_id), Jigsaw.user_id==BeanieObjectId(user.id)).delete()
    await Image.find(Image.id==BeanieObjectId(image_id), Image.user_id==BeanieObjectId(user.id)).delete()

    return ok_response()


@router.post("/post-to-sqs")
async def http_post_to_sqs():
    data = {
        "Luffy": "Captain of the Crew"
    }
    ans = await post_to_sqs(data)
    return ok_response()
