from __future__ import annotations

import threading
from typing import Any

_runtime_override: dict[str, Any] = {}
_runtime_lock = threading.Lock()


def get_runtime_override() -> dict[str, Any]:
    with _runtime_lock:
        return dict(_runtime_override)


def set_runtime_override(key: str, value: Any) -> None:
    with _runtime_lock:
        _runtime_override[key] = value


def clear_runtime_overrides() -> dict[str, Any]:
    with _runtime_lock:
        snapshot = dict(_runtime_override)
        _runtime_override.clear()
        return snapshot
