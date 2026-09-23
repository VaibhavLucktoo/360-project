from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, field_validator
from app.schemas.access_validation import PositiveId, clean_text
from app.permission_catalog import PERMISSIONS


class RoleWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role_name: Annotated[str, BeforeValidator(clean_text), Field(min_length=1, max_length=50)]
    permission_ids: list[PositiveId] = Field(default_factory=list, max_length=len(PERMISSIONS))

    @field_validator("permission_ids")
    @classmethod
    def unique_permissions(cls, value):
        if len(value) != len(set(value)):
            raise ValueError("Permission IDs must be unique")
        return value


class RoleUpdate(RoleWrite):
    permission_ids: list[PositiveId] = Field(max_length=len(PERMISSIONS))


class PermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    key: str
    description: str | None


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    role_name: str
    permissions: list[PermissionResponse]


class RoleAssignment(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role_id: PositiveId
