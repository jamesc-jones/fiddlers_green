import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import chat, contact

load_dotenv()

docs_disabled = os.getenv("DISABLE_DOCS", "false").lower() == "true"
docs_url = None if docs_disabled else "/docs"
redoc_url = None if docs_disabled else "/redoc"

app = FastAPI(title="Fiddler's Green API", docs_url=docs_url, redoc_url=redoc_url)

allowed_origins = ["http://localhost:3000"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contact.router)
app.include_router(chat.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
