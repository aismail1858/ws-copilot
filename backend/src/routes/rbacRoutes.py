from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from src.services.supabase import supabase
from src.services.jwtAuth import get_current_user, require_tier, TIER_RANK
from src.services.access import get_accessible_document_ids
from src.config.logging import get_logger, set_user_id

logger = get_logger(__name__)
router = APIRouter(tags=["rbac"])

"""
/api/rbac  —  Rollen- & Berechtigungsmodell (ADR-001)
  - GET    /roles                          Rollen-Registry
  - GET    /teams                          Teams (admin: alle; team_lead/member: eigene)
  - POST   /teams                          Team anlegen (admin)
  - GET    /teams/{team_id}/members        Mitglieder eines Teams
  - POST   /teams/{team_id}/members        Mitglied hinzufuegen (admin | Team-Lead des Teams)
  - DELETE /teams/{team_id}/members/{uid}  Mitglied entfernen
  - GET    /sources                        Zugriffsbare Quellen des Nutzers
  - PUT    /sources/{doc_id}/visibility    Sichtbarkeit setzen
  - POST   /sources/{doc_id}/members       Quelle einzelnen Mitgliedern zuweisen
  - DELETE /sources/{doc_id}/members/{uid} Einzelzugriff entziehen
"""

# ---------------------------------------------------------------------------
# Pydantic-Modelle
# ---------------------------------------------------------------------------


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    lead_id: str = Field(..., description="UUID des Team-Leads")


class MemberAdd(BaseModel):
    user_id: str = Field(...)


class VisibilityUpdate(BaseModel):
    visibility: str = Field(..., description="global | team | members | private")
    team_id: Optional[str] = Field(None)


class SourceMemberGrant(BaseModel):
    user_id: str = Field(...)


# ---------------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------------


def _is_admin(user: dict) -> bool:
    return user.get("tier") == "admin"


def _team_of_lead(user: dict) -> list[str]:
    """Alle team_ids, in denen der Nutzer Lead ist."""
    res = (
        supabase.table("teams")
        .select("id")
        .eq("lead_id", user["id"])
        .execute()
    )
    return [t["id"] for t in (res.data or [])]


def _assert_can_manage_team(user: dict, team_id: str):
    """Admin oder Lead des gegebenen Teams, sonst 403."""
    if _is_admin(user):
        return
    if team_id not in _team_of_lead(user):
        raise HTTPException(status_code=403, detail="Keine Berechtigung fuer dieses Team")


def _team_exists(team_id: str) -> dict:
    res = supabase.table("teams").select("*").eq("id", team_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Team nicht gefunden")
    return res.data[0]


# ---------------------------------------------------------------------------
# Rollen
# ---------------------------------------------------------------------------


@router.get("/roles")
async def list_roles(user: dict = Depends(get_current_user)):
    res = supabase.table("roles").select("key, label, tier, is_system").order("tier").execute()
    return {"roles": res.data or []}


# ---------------------------------------------------------------------------
# Teams
# ---------------------------------------------------------------------------


@router.get("/teams")
async def list_teams(user: dict = Depends(get_current_user)):
    set_user_id(user["id"])
    if _is_admin(user):
        res = (
            supabase.table("teams")
            .select("id, name, slug, lead_id, created_at, users!teams_lead_id_fkey(email, display_name)")
            .order("created_at", desc=True)
            .execute()
        )
        return {"teams": res.data or []}
    # team_lead/member: nur Teams, in denen sie Mitglied ODER Lead sind
    member_res = (
        supabase.table("team_members")
        .select("team_id")
        .eq("user_id", user["id"])
        .execute()
    )
    team_ids = {m["team_id"] for m in (member_res.data or [])} | set(_team_of_lead(user))
    if not team_ids:
        return {"teams": []}
    res = (
        supabase.table("teams")
        .select("id, name, slug, lead_id, created_at, users!teams_lead_id_fkey(email, display_name)")
        .in_("id", list(team_ids))
        .execute()
    )
    return {"teams": res.data or []}


@router.post("/teams")
async def create_team(body: TeamCreate, user: dict = Depends(require_tier("admin"))):
    set_user_id(user["id"])
    # Lead muss Tier team_lead oder admin haben
    lead = (
        supabase.table("users")
        .select("id, role, roles!users_role_fk(tier)")
        .eq("id", body.lead_id)
        .execute()
    )
    if not lead.data:
        raise HTTPException(status_code=404, detail="Lead-Nutzer nicht gefunden")
    tier = _tier_of_row(lead.data[0])
    if tier not in ("team_lead", "admin"):
        raise HTTPException(status_code=422, detail="Lead muss Tier 'team_lead' sein")
    slug_taken = supabase.table("teams").select("id").eq("slug", body.slug).execute()
    if slug_taken.data:
        raise HTTPException(status_code=409, detail="Slug bereits vergeben")
    res = (
        supabase.table("teams")
        .insert({"name": body.name, "slug": body.slug, "lead_id": body.lead_id})
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=422, detail="Team konnte nicht angelegt werden")
    return {"message": "Team angelegt", "team": res.data[0]}


# ---------------------------------------------------------------------------
# Team-Mitglieder
# ---------------------------------------------------------------------------


@router.get("/teams/{team_id}/members")
async def list_team_members(team_id: str, user: dict = Depends(get_current_user)):
    _team_exists(team_id)
    _assert_can_manage_team(user, team_id)
    res = (
        supabase.table("team_members")
        .select("user_id, created_at, users!team_members_user_id_fkey(email, display_name, role)")
        .eq("team_id", team_id)
        .execute()
    )
    return {"members": res.data or []}


@router.post("/teams/{team_id}/members")
async def add_team_member(team_id: str, body: MemberAdd, user: dict = Depends(get_current_user)):
    _team_exists(team_id)
    _assert_can_manage_team(user, team_id)
    target = supabase.table("users").select("id").eq("id", body.user_id).execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Nutzer nicht gefunden")
    res = (
        supabase.table("team_members")
        .insert({"team_id": team_id, "user_id": body.user_id, "added_by": user["id"]})
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=409, detail="Mitglied existiert bereits")
    return {"message": "Mitglied hinzugefuegt", "member": res.data[0]}


@router.delete("/teams/{team_id}/members/{uid}")
async def remove_team_member(team_id: str, uid: str, user: dict = Depends(get_current_user)):
    _team_exists(team_id)
    _assert_can_manage_team(user, team_id)
    res = (
        supabase.table("team_members")
        .delete()
        .eq("team_id", team_id)
        .eq("user_id", uid)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")
    return {"message": "Mitglied entfernt"}


# ---------------------------------------------------------------------------
# Quellen — Zugriff & Sichtbarkeit
# ---------------------------------------------------------------------------


@router.get("/sources")
async def list_accessible_sources(user: dict = Depends(get_current_user)):
    """Alle Quellen, die der Nutzer sehen darf (global/team/members/eigene)."""
    set_user_id(user["id"])
    ids = get_accessible_document_ids(user["id"])
    if not ids:
        return {"sources": []}
    res = (
        supabase.table("project_documents")
        .select("id, filename, file_type, file_size, processing_status, visibility, team_id, owner_id, project_id, created_at")
        .in_("id", ids)
        .order("created_at", desc=True)
        .execute()
    )
    return {"sources": res.data or []}


@router.put("/sources/{doc_id}/visibility")
async def set_source_visibility(
    doc_id: str, body: VisibilityUpdate, user: dict = Depends(get_current_user)
):
    set_user_id(user["id"])
    if body.visibility not in ("global", "team", "members", "private"):
        raise HTTPException(status_code=422, detail="Ungueltige Sichtbarkeit")

    doc = supabase.table("project_documents").select("id, owner_id, team_id").eq("id", doc_id).execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Quelle nicht gefunden")
    doc_row = doc.data[0]

    update = {"visibility": body.visibility, "team_id": None}
    if body.visibility == "global":
        if not _is_admin(user):
            raise HTTPException(status_code=403, detail="Nur Admins duerfen globale Quellen erstellen")
    elif body.visibility == "team":
        team_id = body.team_id or doc_row.get("team_id")
        if not team_id:
            raise HTTPException(status_code=422, detail="team_id erforderlich")
        _assert_can_manage_team(user, team_id)
        update["team_id"] = team_id
    elif body.visibility == "members":
        # team_lead darf nur fuer eigenes Team; rein technisch hier nur Eigentuemer/Admin.
        if not _is_admin(user) and doc_row.get("owner_id") != user["id"]:
            led_teams = _team_of_lead(user)
            if not led_teams:
                raise HTTPException(status_code=403, detail="Keine Berechtigung")
    else:  # private
        if not _is_admin(user) and doc_row.get("owner_id") != user["id"]:
            raise HTTPException(status_code=403, detail="Keine Berechtigung")

    res = supabase.table("project_documents").update(update).eq("id", doc_id).execute()
    if not res.data:
        raise HTTPException(status_code=422, detail="Aktualisierung fehlgeschlagen")
    return {"message": "Sichtbarkeit aktualisiert", "source": res.data[0]}


@router.post("/sources/{doc_id}/members")
async def grant_source_member(
    doc_id: str, body: SourceMemberGrant, user: dict = Depends(get_current_user)
):
    set_user_id(user["id"])
    doc = supabase.table("project_documents").select("id, owner_id, visibility, team_id").eq("id", doc_id).execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Quelle nicht gefunden")
    doc_row = doc.data[0]
    if not _is_admin(user):
        if doc_row.get("owner_id") != user["id"] and doc_row.get("team_id") not in _team_of_lead(user):
            raise HTTPException(status_code=403, detail="Keine Berechtigung")
    target = supabase.table("users").select("id").eq("id", body.user_id).execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Nutzer nicht gefunden")
    res = (
        supabase.table("source_members")
        .insert({"document_id": doc_id, "user_id": body.user_id, "granted_by": user["id"]})
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=409, detail="Zugriff bereits vorhanden")
    # Sichtbarkeit sicherstellen, damit die Quelle fuer den Nutzer sichtbar wird
    if doc_row.get("visibility") not in ("members", "global", "team"):
        supabase.table("project_documents").update({"visibility": "members"}).eq("id", doc_id).execute()
    return {"message": "Zugriff gewaehrt"}


@router.delete("/sources/{doc_id}/members/{uid}")
async def revoke_source_member(
    doc_id: str, uid: str, user: dict = Depends(get_current_user)
):
    doc = supabase.table("project_documents").select("id, owner_id, team_id").eq("id", doc_id).execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Quelle nicht gefunden")
    doc_row = doc.data[0]
    if not _is_admin(user):
        if doc_row.get("owner_id") != user["id"] and doc_row.get("team_id") not in _team_of_lead(user):
            raise HTTPException(status_code=403, detail="Keine Berechtigung")
    res = (
        supabase.table("source_members")
        .delete()
        .eq("document_id", doc_id)
        .eq("user_id", uid)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Zugriff nicht gefunden")
    return {"message": "Zugriff entzogen"}


# ---------------------------------------------------------------------------
# intern
# ---------------------------------------------------------------------------


def _tier_of_row(row: dict) -> str:
    roles_row = row.get("roles")
    if isinstance(roles_row, dict):
        return roles_row.get("tier", "member")
    if isinstance(roles_row, list) and roles_row:
        return roles_row[0].get("tier", "member")
    return "member"
