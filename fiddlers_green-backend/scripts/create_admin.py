"""
Phase 17.5 audit fix — CLI to create an admin account.

Before this script existed, there was no way to create the first
production admin account other than direct SQL against the live
database. Run this instead, e.g.:

    docker compose exec backend python scripts/create_admin.py --email admin@example.com

Password is never taken as a command-line argument (it would leak into
shell history and `ps` output) — it's always prompted for via getpass,
which does not echo to the terminal.

Reuses repositories.user.create_user() (the same function
routes/auth.py's /auth/register uses) with role="admin", so the created
account is bcrypt-hashed and stored exactly like any other user — no
separate code path, no separate table.
"""
import argparse
import asyncio
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pydantic import EmailStr, TypeAdapter, ValidationError  # noqa: E402

from database import AsyncSessionLocal  # noqa: E402
from repositories.user import create_user  # noqa: E402

MIN_PASSWORD_LENGTH = 8
_EMAIL_ADAPTER = TypeAdapter(EmailStr)


async def _create_admin(email: str, password: str) -> None:
    if AsyncSessionLocal is None:
        print("ERROR: DATABASE_URL is not configured. Aborting.", file=sys.stderr)
        raise SystemExit(1)

    async with AsyncSessionLocal() as session:
        try:
            user = await create_user(
                session=session,
                email=email,
                plain_password=password,
                role="admin",
            )
        except ValueError as e:
            print(f"ERROR: {e}", file=sys.stderr)
            raise SystemExit(1)

    print(f"Admin account created: id={user.id} email={user.email}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an admin account.")
    parser.add_argument("--email", required=True, help="Admin account email address.")
    args = parser.parse_args()

    try:
        email = _EMAIL_ADAPTER.validate_python(args.email)
    except ValidationError:
        print(f"ERROR: {args.email!r} is not a valid email address.", file=sys.stderr)
        raise SystemExit(1)

    password = getpass.getpass("Admin password: ")
    if len(password) < MIN_PASSWORD_LENGTH:
        print(f"ERROR: Password must be at least {MIN_PASSWORD_LENGTH} characters.", file=sys.stderr)
        raise SystemExit(1)
    confirm = getpass.getpass("Confirm password: ")
    if password != confirm:
        print("ERROR: Passwords do not match.", file=sys.stderr)
        raise SystemExit(1)

    asyncio.run(_create_admin(email, password))


if __name__ == "__main__":
    main()
