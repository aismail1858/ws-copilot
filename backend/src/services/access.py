from src.services.supabase import supabase
from src.config.logging import get_logger

logger = get_logger(__name__)


def get_accessible_document_ids(user_id: str) -> list[str]:
    """Zugriffsmenge eines Nutzers (ADR-001). Ersetzt Streu-Filter .eq(user_id).

    Quelle(n): RPC `accessible_document_ids(uuid)` in
    `backend/supabase/migrations/20260704000001_rbac_quellen.sql`.
    """
    if not user_id:
        return []
    try:
        result = supabase.rpc(
            "accessible_document_ids", {"p_user": user_id}
        ).execute()
        return [row for row in (result.data or [])]
    except Exception as e:
        logger.error("accessible_document_ids_failed", user_id=user_id, error=str(e))
        return []
