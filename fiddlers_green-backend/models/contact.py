from typing import Optional

from pydantic import BaseModel, EmailStr


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str
    inquiry_type: Optional[str] = None


class ContactResponse(BaseModel):
    ok: bool
    detail: str
