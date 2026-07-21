from fastapi import APIRouter, HTTPException

from models.chat import ChatRequest, ChatResponse
from services.ai_service import get_budtender_response

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        reply = await get_budtender_response(request.message)
    except Exception as error:
        print(f"Failed to get AI response: {error}")
        raise HTTPException(
            status_code=502,
            detail="Failed to reach the assistant. Please try again later.",
        )

    return ChatResponse(reply=reply)
