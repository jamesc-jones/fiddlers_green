import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from logging_config import RequestIdMiddleware, setup_logging
from routes import chat, contact
from routes.auth import router as auth_router
from routes.admin import router as admin_router
from routes.customer import router as customer_router
from routes.cart import router as cart_router
from routes.products import router as products_router

load_dotenv()
setup_logging()

logger = logging.getLogger(__name__)

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
# Added after CORSMiddleware so it wraps outermost (Starlette applies
# middleware in reverse of add order) — the request ID must be set before
# anything else in the pipeline runs, so every log line produced while
# handling this request (including CORS/validation/exception-handler
# logging) is tagged.
app.add_middleware(RequestIdMiddleware)

app.include_router(contact.router)
app.include_router(chat.router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(customer_router)
app.include_router(cart_router)
app.include_router(products_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Flattens Pydantic's default {"detail": [{...}, ...]} shape into
    {"detail": "<string>"} — every other error path in this API already
    returns a single string, and lib/api.ts's frontend error handling
    already expects one (it falls back to a generic message otherwise).
    """
    messages = "; ".join(
        f"{'.'.join(str(loc) for loc in err['loc'] if loc != 'body')}: {err['msg']}"
        for err in exc.errors()
    )
    logger.warning("Validation error on %s %s: %s", request.method, request.url.path, messages)
    return JSONResponse(status_code=422, content={"detail": messages})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all for anything that isn't an HTTPException (which FastAPI
    already handles separately and takes priority over this). Makes the
    "never leak a stack trace" guarantee explicit and tested rather than
    relying on FastAPI's implicit default, and ensures every unexpected
    failure is actually logged server-side.
    """
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


@app.get("/health")
async def health():
    return {"status": "ok"}
