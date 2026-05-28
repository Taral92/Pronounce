from __future__ import annotations

from fastapi import Depends, HTTPException, Header
import jwt
from app.config import settings


def _decode_token(token: str) -> dict:
    try:
        print("JWT key starts:", settings.CLERK_JWT_KEY[:30])
        print("JWT key has escaped n:", "\\n" in settings.CLERK_JWT_KEY)
        public_key = settings.CLERK_JWT_KEY.replace("\\n", "\n")
        print("Public key after replacement:", public_key[:30])

        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
    except Exception as exc:
        print("JWT decode error:", repr(exc))
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc

    azp = payload.get("azp")
    allowed_azp = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    }

    if azp and azp not in allowed_azp:
        raise HTTPException(status_code=401, detail=f"Invalid token azp: {azp}")

    return payload


async def get_current_user(authorization: str = Header(...)) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1]
    return _decode_token(token)


async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    if user.get("sub") != settings.ADMIN_CLERK_USER_ID:
        raise HTTPException(status_code=403, detail="Admin access only")
    return user


async def get_tutor_user(user: dict = Depends(get_current_user)) -> dict:
    meta = user.get("public_metadata", {}) or {}
    if meta.get("role") not in ("tutor", "admin"):
        raise HTTPException(status_code=403, detail="Tutor access only")
    return user