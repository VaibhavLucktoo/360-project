from pydantic import BaseModel, ConfigDict, Field, field_validator

OPTION_TEXT_MAX_WORDS = 20


def count_words(value: str) -> int:
    return len(value.split())


class QuestionOptionCreate(BaseModel):
    option_text: str = Field(min_length=1, max_length=500)
    display_order: int = Field(ge=1)

    @field_validator("option_text")
    @classmethod
    def clean_option_text(cls, value: str) -> str:
        # Remove extra spaces and reject empty values.
        value = value.strip()

        if not value:
            raise ValueError("Option text cannot be empty")

        if count_words(value) > OPTION_TEXT_MAX_WORDS:
            raise ValueError(f"Option text cannot exceed {OPTION_TEXT_MAX_WORDS} words")

        return value


class QuestionOptionUpdate(BaseModel):
    # Existing options have an ID; new options do not.
    id: int | None = None

    option_text: str = Field(min_length=1, max_length=500)
    display_order: int = Field(ge=1)

    @field_validator("option_text")
    @classmethod
    def clean_option_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Option text cannot be empty")

        if count_words(value) > OPTION_TEXT_MAX_WORDS:
            raise ValueError(f"Option text cannot exceed {OPTION_TEXT_MAX_WORDS} words")

        return value


class QuestionOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_id: int
    option_text: str
    display_order: int
