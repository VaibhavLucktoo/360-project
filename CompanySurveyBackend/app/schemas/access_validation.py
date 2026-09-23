"""Shared constraints for role and user administration."""
from typing import Annotated

from pydantic import BeforeValidator, Field

MAX_DATABASE_ID = 2_147_483_647
PositiveId = Annotated[int, Field(gt=0, le=MAX_DATABASE_ID, strict=True)]


def clean_text(value):
    if not isinstance(value, str):
        raise ValueError("Must be text")
    value = value.strip()
    if not value:
        raise ValueError("Field cannot be empty")
    if not value.isprintable():
        raise ValueError("Control characters are not allowed")
    return value


def clean_identifier(value):
    value = clean_text(value)
    if any(character.isspace() for character in value):
        raise ValueError("Employee ID cannot contain spaces")
    return value


def clean_email(value):
    return clean_text(value).lower()


def clean_password(value):
    value = clean_text(value)
    if any(character.isspace() for character in value):
        raise ValueError("Password cannot contain spaces")
    return value


def validate_new_password(value):
    value = clean_password(value)
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password must be at most 72 UTF-8 bytes")
    return value


Name = Annotated[str, BeforeValidator(clean_text), Field(min_length=1, max_length=100)]
EmployeeId = Annotated[str, BeforeValidator(clean_identifier), Field(min_length=1, max_length=10)]
NewPassword = Annotated[str, BeforeValidator(validate_new_password), Field(min_length=8, max_length=72)]
