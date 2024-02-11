import uuid

from app.config import Config
from app.zohomail import send_email
from auth.models import UserVerification

from app.logger import get_logger

logger = get_logger(__name__)


def email_verification_msg(recipient, secret):
    username = recipient.split("@")[0]
    return {
        "subject": f"Verify your account with {Config.API_URL}",
        "content": f"Hi {username}, click here to verify your email: {Config.API_URL}/auth/verify-me/{secret}",
        "recipient": recipient,
    }


async def send_verification_msg(user, mode="email"):
    if mode == "email":
        secret = uuid.uuid4().__str__()

    uv = UserVerification(user_id=user.id, mode=mode, secret=secret)
    await uv.create()

    mail_content = email_verification_msg(user.email, secret)
    send_email(
        mail_content["subject"], mail_content["content"], mail_content["recipient"]
    )
