"""
Phase 17.5 audit fix — lightweight in-process rate limiting.
No Redis or external services: state is a plain in-memory dict scoped to
this process, sufficient for the current single-worker deployment. A
multi-worker/multi-instance deployment would need a shared store instead
(explicitly out of scope for this fix — no new infrastructure).
"""
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import HTTPException, Request, status


class RateLimiter:
    """
    Sliding-window limiter: allows at most `max_requests` within the last
    `window_seconds`, keyed by (route path, client IP). Use as a FastAPI
    dependency, e.g. `dependencies=[Depends(RateLimiter(5, 60))]`.
    """

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    async def __call__(self, request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        key = f"{request.url.path}:{client_ip}"
        now = time.monotonic()
        hits = self._hits[key]

        while hits and now - hits[0] > self.window_seconds:
            hits.popleft()

        if len(hits) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )

        hits.append(now)
