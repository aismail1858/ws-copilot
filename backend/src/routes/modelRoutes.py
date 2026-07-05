from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Literal
import asyncio
import time
from src.services.supabase import supabase
from src.services.jwtAuth import get_current_user, require_tier
from src.config.logging import get_logger, set_user_id
from src.services.llm import get_chat_llm

logger = get_logger(__name__)
router = APIRouter(tags=["models"])

"""
/api  —  Requesty-Modellkatalog (TASK-2026-07-04-admin-settings-models)
  - GET    /models                 Aktivierte Modelle (auth)
  - GET    /admin/models           Alle Modelle inkl. deaktiviert (admin)
  - POST   /admin/models           Modell anlegen (admin)
  - PATCH  /admin/models/{id}      Modell aktualisieren (admin)
  - DELETE /admin/models/{id}      Modell loeschen (admin)
"""

Purpose = Literal["chat", "mini", "embeddings", "embeddings_llm"]

_PUBLIC_FIELDS = "id, label, model_id, purpose, enabled, sort_order, created_at, updated_at"


class ModelCreate(BaseModel):
    label: str = Field(..., min_length=1)
    model_id: str = Field(..., min_length=1)
    purpose: Purpose = "chat"
    enabled: bool = True
    sort_order: int = 0


class ModelUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1)
    model_id: Optional[str] = Field(None, min_length=1)
    purpose: Optional[Purpose] = None
    enabled: Optional[bool] = None
    sort_order: Optional[int] = None


@router.get("/models")
async def list_enabled_models(user: dict = Depends(get_current_user)):
    """Aktivierte Modelle fuer authentifizierte Nutzer (z.B. Chat-Modellauswahl)."""
    res = (
        supabase.table("app_models")
        .select(_PUBLIC_FIELDS)
        .eq("enabled", True)
        .order("sort_order")
        .order("label")
        .execute()
    )
    return {"models": res.data or []}


@router.get("/admin/models")
async def list_all_models(user: dict = Depends(require_tier("admin"))):
    """Alle Modelle inkl. deaktiviert — nur Admin."""
    set_user_id(user["id"])
    res = (
        supabase.table("app_models")
        .select(_PUBLIC_FIELDS)
        .order("sort_order")
        .order("label")
        .execute()
    )
    return {"models": res.data or []}


def _assert_model_id_unique(model_id: str, exclude_id: Optional[str] = None) -> None:
    q = supabase.table("app_models").select("id").eq("model_id", model_id)
    if exclude_id:
        q = q.neq("id", exclude_id)
    if q.execute().data:
        raise HTTPException(status_code=409, detail="Modell-ID bereits vorhanden")


@router.post("/admin/models")
async def create_model(body: ModelCreate, user: dict = Depends(require_tier("admin"))):
    set_user_id(user["id"])
    _assert_model_id_unique(body.model_id)
    res = (
        supabase.table("app_models")
        .insert(body.model_dump())
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=422, detail="Modell konnte nicht angelegt werden")
    logger.info("model_created", extra={"model_id": body.model_id})
    return {"message": "Modell angelegt", "model": res.data[0]}


@router.patch("/admin/models/{model_pk}")
async def update_model(
    model_pk: str,
    body: ModelUpdate,
    user: dict = Depends(require_tier("admin")),
):
    set_user_id(user["id"])
    existing = supabase.table("app_models").select("id").eq("id", model_pk).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Modell nicht gefunden")

    patch = body.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPException(status_code=422, detail="Keine Aenderung angegeben")
    if "model_id" in patch and patch["model_id"] is not None:
        _assert_model_id_unique(patch["model_id"], exclude_id=model_pk)

    res = supabase.table("app_models").update(patch).eq("id", model_pk).execute()
    if not res.data:
        raise HTTPException(status_code=422, detail="Aktualisierung fehlgeschlagen")
    return {"message": "Modell aktualisiert", "model": res.data[0]}


@router.delete("/admin/models/{model_pk}")
async def delete_model(model_pk: str, user: dict = Depends(require_tier("admin"))):
    set_user_id(user["id"])
    res = supabase.table("app_models").delete().eq("id", model_pk).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Modell nicht gefunden")
    logger.info("model_deleted", extra={"model_pk": model_pk})
    return {"message": "Modell geloescht"}


class MyModelRequest(BaseModel):
    model_id: Optional[str] = None


@router.get("/me/model")
async def get_my_model(user: dict = Depends(get_current_user)):
    """Standard-Chatmodell des Nutzers (aus app_models)."""
    res = (
        supabase.table("users")
        .select("default_chat_model_id")
        .eq("id", user["id"])
        .single()
        .execute()
    )
    return {"model_id": (res.data or {}).get("default_chat_model_id")}


@router.put("/me/model")
async def set_my_model(body: MyModelRequest, user: dict = Depends(get_current_user)):
    """Standard-Chatmodell speichern (model_id muss aktivierter chat-Eintrag aus app_models sein)."""
    model_id = body.model_id or None
    if model_id:
        valid = (
            supabase.table("app_models")
            .select("id")
            .eq("model_id", model_id)
            .eq("purpose", "chat")
            .eq("enabled", True)
            .execute()
        )
        if not valid.data:
            raise HTTPException(status_code=422, detail="Modell nicht verfuegbar oder nicht aktiviert")
    supabase.table("users").update({"default_chat_model_id": model_id}).eq("id", user["id"]).execute()
    return {"message": "Standard-Chatmodell gespeichert", "model_id": model_id}


@router.post("/admin/models/{model_pk}/test")
async def test_model(model_pk: str, user: dict = Depends(require_tier("admin"))):
    """Ping-Test: sendet 'Ping' an das Modell (via Requesty) und meldet ok/Latenz/Fehler."""
    row = (
        supabase.table("app_models")
        .select("model_id, label")
        .eq("id", model_pk)
        .single()
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Modell nicht gefunden")
    model_id = row.data["model_id"]
    start = time.perf_counter()
    try:
        await asyncio.wait_for(
            get_chat_llm(model_id).ainvoke("Ping"),
            timeout=15.0,
        )
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {"ok": True, "latency_ms": latency_ms, "model_id": model_id}
    except asyncio.TimeoutError:
        return {"ok": False, "error": "Timeout (15s)", "model_id": model_id}
    except Exception as e:
        return {"ok": False, "error": str(e), "model_id": model_id}
