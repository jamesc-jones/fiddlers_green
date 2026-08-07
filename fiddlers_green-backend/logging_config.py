"""
Structured JSON logging + lightweight per-request tracing.

Phase 17 Step 4: no file in routes/, repositories/, or services/ needs to
change to benefit from this — they already call
logging.getLogger(__name__).info/warning/error/exception(...) throughout
the app. Before this module existed, nothing ever called
logging.basicConfig() (or configured a handler/level any other way), so
every one of those calls below WARNING severity was silently discarded —
confirmed empirically: adding a cart item produced no log line at all,
only uvicorn's own unrelated access-log entry. This module is what
actually makes that existing logging visible, structured, and traceable.
"""
import contextvars
import json
import logging
import uuid
from typing import Optional

from starlette.types import ASGIApp, Receive, Scope, Send

_request_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "request_id", default=None
)

# Defense in depth: if a future log call ever passes one of these via
# logger.info(..., extra={...}), it is stripped before the line is
# emitted. Every *existing* log call site in this codebase was manually
# audited for Phase 17 and confirmed to log only IDs, emails, names,
# quantities, and generic error text — never a password, hash, token, or
# Authorization header.
_REDACTED_KEYS = {"password", "plain_password", "password_hash", "token", "authorization"}


class RequestIdFilter(logging.Filter):
    """Attaches the current request's ID (if any) to every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = _request_id_ctx.get()
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", None),
        }
        if record.exc_info:
            exc_type = record.exc_info[0]
            payload["exc_type"] = exc_type.__name__ if exc_type else None
            payload["exc_text"] = self.formatException(record.exc_info)
        for key in _REDACTED_KEYS:
            payload.pop(key, None)
        return json.dumps(payload, default=str)


def setup_logging() -> None:
    """Call once at app startup (see main.py). Idempotent."""
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    handler.addFilter(RequestIdFilter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)

    # uvicorn's own access/error loggers already have their own handler
    # and format, attached by uvicorn itself, and also propagate up to
    # root by default — without disabling that, every uvicorn log line
    # would be printed twice (once in uvicorn's format, once re-wrapped
    # as JSON here). This leaves uvicorn's own logging completely
    # untouched; it only stops it from being duplicated through ours.
    logging.getLogger("uvicorn.access").propagate = False
    logging.getLogger("uvicorn.error").propagate = False


class RequestIdMiddleware:
    """
    Plain ASGI middleware: assigns a UUID to the request-scoped contextvar
    for the lifetime of each HTTP request, so every log line emitted while
    handling it — from a route, a repository, a service, anywhere — is
    automatically tagged via RequestIdFilter above, with no request_id
    parameter threaded through any function signature.

    contextvars are per-asyncio-Task, so concurrent requests (each its
    own Task under uvicorn) never see each other's request_id.

    Internal only, by design: never attached to the response, so it's not
    part of the API contract and never visible to a client.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        token = _request_id_ctx.set(str(uuid.uuid4()))
        try:
            await self.app(scope, receive, send)
        finally:
            _request_id_ctx.reset(token)
