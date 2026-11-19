import uuid
from django.db import models

class UUIDModel(models.Model):
    """Abstract model that uses UUID4 as its primary key."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True

class TimeStampedModel(models.Model):
    """Abstract model providing self-updating created_at and updated_at fields."""
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class BaseModel(UUIDModel, TimeStampedModel):
    """Abstract base model combining UUID primary key and timestamps."""
    class Meta:
        abstract = True

