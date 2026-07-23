from typing import Literal, Optional

from pydantic import BaseModel, EmailStr


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str
    inquiry_type: Optional[Literal["general", "wholesale"]] = "general"


class ContactResponse(BaseModel):
    ok: bool
    detail: str
