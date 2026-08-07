from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    # Previously unbounded — a very large message is sent verbatim to the
    # Anthropic API (services/ai_service.py), so this caps both cost and
    # abuse potential. routes/chat.py's existing `.strip()` blank-check is
    # left as-is: it correctly rejects whitespace-only messages, which a
    # bare Pydantic min_length wouldn't catch.
    message: str = Field(max_length=2000)


class ChatResponse(BaseModel):
    reply: str
