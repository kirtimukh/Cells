import json, requests

import boto3

import botocore.session
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.config import Config as S3Config
from botocore.exceptions import NoCredentialsError

from app.config import Config as AppConfig
from app.caching import redis_cache


s3 = boto3.resource("s3")
s3_client = boto3.client(
    "s3",
    config=S3Config(signature_version="s3v4"),
    region_name="ap-south-1"
)
sqs_client = boto3.client('sqs')


def generate_presigned_url(
    image_path,
    method="get_object",
    bucket_name=AppConfig.CELL_BUCKET,
    valid_seconds=3600,
):
    if method not in ["get_object", "put_object"]:
        raise ValueError("Invalid method provided")

    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket_name, "Key": image_path},
        ExpiresIn=valid_seconds,
    )


def generate_presigned_post(
    image_path, jigconfig,
    bucket_name=AppConfig.CELL_BUCKET,
    expires_in=AppConfig.S3_PRESIGNED_POST_TIMEOUT
):

    config_fields_dict = {
        # "acl": "public-read",
        "Content-Type": "image/png"
    }
    config_fields_dict.update(
        {"x-amz-meta-" + key.lower(): str(value) for key, value in jigconfig.items()}
    )

    conditions = [
        # {"acl": "public-read"},
        ["content-length-range", 50, 5 * 1024 * 1024],
        {"content-type": "image/png"}
    ]
    conditions.extend(
        [{"x-amz-meta-" + key.lower(): str(value)} for key, value in jigconfig.items()]
    )

    return s3_client.generate_presigned_post(
        Bucket=bucket_name,
        Key=image_path,
        Fields=config_fields_dict,
        Conditions=conditions,
        ExpiresIn=expires_in,
    )


def load_image_from_s3(streambody):
    pass


def get_and_read_s3_object(bucket_name, key, ftype="json"):
    file_object = s3.Object(bucket_name, key)
    file_content = file_object.get().get("Body").read()
    if ftype == "json":
        file_content = file_content.decode("utf-8")
        return json.loads(file_content)
    elif ftype == "image":
        return load_image_from_s3(file_content)


def delete_image_from_s3(bucket_name, image_dir):
    response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=image_dir)

    if 'Contents' in response:
        keys = [{'Key': obj['Key']} for obj in response['Contents']]
        s3_client.delete_objects(Bucket=bucket_name, Delete={'Objects': keys})


async def get_image_url(owner_id, image_id):
    cache_key = f"presigned_s3:{image_id}"

    presigned_url = await redis_cache.get(cache_key)
    if not presigned_url:
        image_path = f"images/{owner_id}/{image_id}/uimage.png"
        presigned_url = generate_presigned_url(image_path)
        await redis_cache.set(cache_key, presigned_url, ex=3600)

    return presigned_url


def get_thumbnail_url(owner_id, image_id):
    return AppConfig.CELL_BUCKET_URL + f"images/{owner_id}/{image_id}/uthumbnail.png"


async def post_to_lambda(data):
    session = botocore.session.Session()
    sigv4 = SigV4Auth(session.get_credentials(),
                    service_name="lambda",
                    region_name="ap-south-1")

    request = AWSRequest(method="POST", url=AppConfig.AWS_LAMBDA_URL, data=json.dumps(data))
    sigv4.add_auth(request)
    signed = request.prepare()

    response = requests.post(signed.url,
                            headers=signed.headers,
                            data=signed.body)

    print('lambda', response.status_code, response.text)
    if response.status_code != 200:
        return False, ''
    else: return True, ''


async def post_to_sqs(data):
    response = sqs_client.send_message(
        QueueUrl=AppConfig.AWS_SQS_URL,
        MessageAttributes={
            
        },
        MessageBody=json.dumps(data),
    )

    return True, ''
