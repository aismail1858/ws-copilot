import jwt
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException, Response, Depends
from src.config.index import appConfig
from src.config.logging import get_logger
from src.services.supabase import supabase

logger = get_logger(__name__)

JWT_SECRET = appConfig.get("jwt_secret", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24
COOKIE_NAME = "session"

# Tier-Rangordnung: kleiner Wert = mehr Rechte.
# Einhaltung via ADR-001 (docs/decisions.md).
TIER_RANK = {"admin": 0, "team_lead": 1, "member": 2}


def create_token(user_id: str, email: str, role: str = "user") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=JWT_EXPIRY_HOURS * 3600,
        path="/",
    )


def clear_auth_cookie(response: Response):
    response.set_cookie(
        key=COOKIE_NAME,
        value="",
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=0,
        path="/",
    )


def _decode_token(request: Request) -> dict:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user_id(request: Request) -> str:
    return _decode_token(request)["sub"]


def get_current_user(request: Request) -> dict:
    """Liefert {id, role, tier} — Tier wird aktuell aus der DB (roles-Join) gelöst."""
    payload = _decode_token(request)
    user_id = payload["sub"]
    role = payload.get("role", "member")
    result = (
        supabase.table("users")
        .select("id, role, roles!users_role_fk(tier)")
        .eq("id", user_id)
        .execute()
    )
    tier = "member"
    if result.data:
        role = result.data[0].get("role", role)
        roles_row = result.data[0].get("roles")
        if isinstance(roles_row, dict):
            tier = roles_row.get("tier", "member")
        elif isinstance(roles_row, list) and roles_row:
            tier = roles_row[0].get("tier", "member")
    return {"id": user_id, "role": role, "tier": tier}


def require_tier(min_tier: str):
    """FastAPI-Dependency: erlaubt ab Tier-Rang <= min_tier (admin < team_lead < member)."""
    required = TIER_RANK.get(min_tier, TIER_RANK["member"])

    def _checker(user: dict = Depends(get_current_user)) -> dict:
        actual = TIER_RANK.get(user.get("tier", "member"), TIER_RANK["member"])
        if actual > required:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return _checker