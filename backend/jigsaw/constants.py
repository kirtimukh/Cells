from enum import Enum


class JStatusEnum(Enum):
    NO_FILE = 0
    PENDING = 5
    IN_PROGRESS = 10
    READY = 15
    FAILED = 20


class RNumEnum(Enum):
    R0 = 0
    R1 = 1
    R2 = 2
    R3 = 3


class MirrorAxisEnum(Enum):
    NONE = None
    HORIZONTAL = 0
    VERTICAL = 1


class VisibilityEnum(Enum):
    OPEN = "open"
    CLOSED = "closed"
    SHARED = "shared"


class ShareableStatusEnum(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    VIEWED = "viewed"
    CHECKEDIN = "checkedin"
    COMPLETED = "completed"
    EXPIRED = "expired"


DEFAULT_SHAREABLE_TTL = 7 * 24  # 7days or 168hrs


MESSAGES_OF_COMPLETION = [
    "Thank you! The pieces are whole again.",
    "Gratitude! The cells are now in harmony.",
    "Well done! You have found the complete picture.",
    "You did it! Order restored, piece by piece.",
    "Each piece has its purpose — and you found it."
]
