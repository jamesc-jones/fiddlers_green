import os

from anthropic import AsyncAnthropic
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = (
    "You are the Fiddler's Green Budtender, a knowledgeable and friendly guide "
    "for Fiddler's Green, a premium Indigenous-owned cannabis brand made in "
    "Tyendinaga. You help visitors with general product guidance, strain "
    "education, and questions about the catalog (flower, hash, and gummies). "
    "Keep responses concise, warm, and professional. Do not give medical "
    "advice or make health claims, and do not encourage use by minors or in "
    "jurisdictions where cannabis is illegal. For medical questions, direct "
    "the user to consult a healthcare provider."
)

MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 512

_client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


async def get_budtender_response(user_message: str) -> str:
    response = await _client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )
    return response.content[0].text
