import bcrypt
from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel, EmailStr
from src.services.supabase import supabase
from src.services.jwtAuth import create_token, set_auth_cookie, clear_auth_cookie, get_current_user_id
from src.config.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str = ""


class PromoteRequest(BaseModel):
    email: str


@router.post("/auth/register")
async def register(body: RegisterRequest, response: Response):
    existing = supabase.table("users").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()

    existing_users = supabase.table("users").select("id").limit(1).execute()
    role = "admin" if not existing_users.data else "member"

    user = (
        supabase.table("users")
        .insert({
            "email": body.email,
            "password_hash": password_hash,
            "display_name": body.display_name or body.email.split("@")[0],
            "role": role,
        })
        .execute()
    )

    if not user.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user_id = user.data[0]["id"]
    token = create_token(user_id, body.email, role)
    set_auth_cookie(response, token)

    return {"message": "User created", "user": {"id": user_id, "email": body.email, "role": role}}


@router.post("/auth/login")
async def login(body: LoginRequest, response: Response):
    result = supabase.table("users").select("*").eq("email", body.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]
    stored_hash = user.get("password_hash")
    if not stored_hash or not bcrypt.checkpw(body.password.encode(), stored_hash.encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    role = user.get("role", "user")
    token = create_token(user["id"], body.email, role)
    set_auth_cookie(response, token)

    return {
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "display_name": user.get("display_name", ""),
            "role": role,
        },
    }


@router.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logged out"}


@router.get("/auth/me")
async def get_me(request: Request):
    try:
        user_id = get_current_user_id(request)
    except HTTPException:
        return {"user": None}

    try:
        result = supabase.table("users").select("id, email, display_name, role, default_chat_model_id, roles!users_role_fk(tier)").eq("id", user_id).execute()
        if not result.data:
            return {"user": None}

        user = result.data[0]
        tier = _tier_of(user)
        return {"user": {"id": user["id"], "email": user["email"], "display_name": user.get("display_name", ""), "role": user.get("role", "member"), "tier": tier, "default_chat_model_id": user.get("default_chat_model_id")}}
    except Exception as e:
        logger.error("get_me_error", error=str(e), exc_info=True)
        return {"user": None}


@router.post("/auth/promote")
async def promote_to_admin(body: PromoteRequest, request: Request):
    caller_id = get_current_user_id(request)
    caller = supabase.table("users").select("role").eq("id", caller_id).execute()
    if not caller.data or caller.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins koennen andere zu Admins machen")

    target = supabase.table("users").select("id, email, role").eq("email", body.email).execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    supabase.table("users").update({"role": "admin"}).eq("id", target.data[0]["id"]).execute()
    return {"message": "Benutzer zum Admin gemacht", "email": body.email}


class AdminCreateUserRequest(BaseModel):
    email: str
    password: str
    display_name: str = ""


@router.post("/auth/users")
async def admin_create_user(body: AdminCreateUserRequest, request: Request):
    try:
        caller_id = get_current_user_id(request)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    try:
        caller = supabase.table("users").select("role").eq("id", caller_id).execute()
        if not caller.data or caller.data[0].get("role") != "admin":
            raise HTTPException(status_code=403, detail="Nur Admins koennen Benutzer erstellen")

        existing = supabase.table("users").select("id").eq("email", body.email).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Email bereits registriert")

        password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()

        user = (
            supabase.table("users")
            .insert({
                "email": body.email,
                "password_hash": password_hash,
                "display_name": body.display_name or body.email.split("@")[0],
                "role": "user",
            })
            .execute()
        )

        if not user.data:
            raise HTTPException(status_code=500, detail="Benutzer konnte nicht erstellt werden")

        return {"message": "Benutzer erstellt", "user": {"id": user.data[0]["id"], "email": body.email, "display_name": body.display_name, "role": "user"}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("admin_create_user_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Fehler beim Erstellen: {str(e)}")


@router.get("/auth/users")
async def list_users(request: Request):
    caller_id = get_current_user_id(request)
    caller = supabase.table("users").select("role").eq("id", caller_id).execute()
    if not caller.data or caller.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins koennen Benutzerlisten abrufen")

    result = supabase.table("users").select("id, email, display_name, role, roles!users_role_fk(tier)").execute()
    users_out = []
    for u in (result.data or []):
        users_out.append({
            "id": u["id"],
            "email": u["email"],
            "display_name": u.get("display_name", ""),
            "role": u.get("role", "member"),
            "tier": _tier_of(u),
        })
    return {"users": users_out}


class SetRoleRequest(BaseModel):
    email: str
    role: str


@router.post("/auth/set-role")
async def set_user_role(body: SetRoleRequest, request: Request):
    """Rolle eines Nutzers setzen (nur Admins). role = Schluessel aus roles-Registry."""
    caller_id = get_current_user_id(request)
    caller = supabase.table("users").select("role, roles!users_role_fk(tier)").eq("id", caller_id).execute()
    if not caller.data or _tier_of(caller.data[0]) != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins duerfen Rollen aendern")

    valid = supabase.table("roles").select("key").eq("key", body.role).execute()
    if not valid.data:
        raise HTTPException(status_code=422, detail="Unbekannte Rolle")

    target = supabase.table("users").select("id, email").eq("email", body.email).execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    supabase.table("users").update({"role": body.role}).eq("id", target.data[0]["id"]).execute()
    return {"message": "Rolle aktualisiert", "email": body.email, "role": body.role}


def _tier_of(row: dict) -> str:
    roles_row = row.get("roles")
    if isinstance(roles_row, dict):
        return roles_row.get("tier", "member")
    if isinstance(roles_row, list) and roles_row:
        return roles_row[0].get("tier", "member")
    return "member"