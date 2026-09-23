from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field, StrictBool, field_validator

from app.schemas.access_validation import (
    EmployeeId, Name, NewPassword, PositiveId, clean_email, clean_password,
)

Email = Annotated[EmailStr, BeforeValidator(clean_email), Field(max_length=255)]


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    employee_id: EmployeeId
    full_name: Name
    email: Email
    password: NewPassword
    role_id: PositiveId
    department: Name
    is_active: StrictBool = True


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    employee_id: EmployeeId | None = None
    full_name: Name
    email: Email
    role_id: PositiveId
    department: Name
    is_active: StrictBool = True


    # Omitted employee IDs preserve the existing value; explicit null is invalid.
    @field_validator("employee_id", mode="before")
    @classmethod
    def reject_null_employee_id(cls, value):
        if value is None:
            raise ValueError("Employee ID cannot be null")
        return value


class PasswordUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    current_password: Annotated[str, BeforeValidator(clean_password), Field(min_length=1, max_length=128)]
    new_password: NewPassword


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: str
    full_name: str
    email: EmailStr
    role: str = Field(validation_alias="role_name")
    role_id: int
    permissions: list[str]
    department: str
    is_active: bool
