from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class ContactRequest(BaseModel):
    # max_length matches ContactSubmission.name (String(255)) — previously
    # unbounded, so an oversized value would have failed as an unhandled DB
    # error rather than a clean 422.
    name: str = Field(max_length=255)
    email: EmailStr
    # ContactSubmission.message is an unbounded Text column, so this cap is
    # purely a Phase 17 abuse/resource-use guard (email body size, DB row
    # size), not a DB-column-width fix.
    message: str = Field(max_length=5000)
    inquiry_type: Optional[Literal["general", "wholesale"]] = "general"

    @field_validator("name", "message")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("This field cannot be blank.")
        return v


class ContactResponse(BaseModel):
    ok: bool
    detail: str
