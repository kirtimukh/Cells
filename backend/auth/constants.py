from enum import Enum


class UVStatusEnum(Enum):
    # User Verification Status
    SENT = "sent"
    VERIFIED = "verified"
    EXPIRED = "expired"


class UVModeEnum(Enum):
    # User Verification Mode
    EMAIL = "email"
    PHONE = "phone"
