"""LLM Response mit Token-Usage-Daten fuer Kosten-Tracking."""
from __future__ import annotations

from pydantic import BaseModel, Field


class TokenUsage(BaseModel):
    """Token-Verbrauch eines einzelnen LLM-Calls."""
    prompt_tokens: int = Field(default=0, description="Input-Tokens")
    completion_tokens: int = Field(default=0, description="Output-Tokens")
    total_tokens: int = Field(default=0, description="Summe")


class LLMResponse(BaseModel):
    """Ergebnis eines LLM.complete()-Calls mit Kosten-Metadaten."""
    text: str = Field(description="Generierter Text")
    usage: TokenUsage = Field(default_factory=TokenUsage)
    model: str = Field(default="", description="Modell-Identifier")
    provider: str = Field(default="", description="Provider-Name")
    latency_ms: float = Field(default=0.0, description="Antwortzeit in Millisekunden")
    cost_usd: float = Field(default=0.0, description="Berechnete Kosten in USD")
