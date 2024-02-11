from beanie import Document
from datetime import datetime
from pydantic import Field


class BaseDocument(Document):
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    async def save(self):
        self.updated_at = datetime.now()
        return await super().save()
