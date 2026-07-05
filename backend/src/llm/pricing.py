"""LLM Pricing: Kosten-Berechnung basierend auf Token-Verbrauch und Modell-Preisen.

Preise werden aus der Konfiguration gelesen oder nutzen hardcoded Standardwerte.
Alle Preise in USD pro 1 Million Tokens.
"""
from __future__ import annotations

import structlog

logger = structlog.get_logger(__name__)

# ── Preise in USD / 1M Tokens (Input, Output) ──────────────────────────────
# Quellen: OpenAI, Anthropic, Google, Ollama (kostenlos)
PRICING_TABLE: dict[str, tuple[float, float]] = {
    # Anthropic Claude
    "claude-3-5-sonnet-20241022":  (3.00, 15.00),
    "claude-3-5-haiku-20241022":  (0.80, 4.00),
    "claude-sonnet-4-20250514":   (3.00, 15.00),
    "claude-haiku-35-20241022":   (0.80, 4.00),
    # OpenAI
    "gpt-4o":                      (2.50, 10.00),
    "gpt-4o-mini":                 (0.15, 0.60),
    "gpt-4-turbo":                 (10.00, 30.00),
    "gpt-4":                       (30.00, 60.00),
    "gpt-3.5-turbo":               (0.50, 1.50),
    # Google Gemini
    "gemini-1.5-pro":              (1.25, 5.00),
    "gemini-1.5-flash":            (0.075, 0.30),
    "gemini-2.0-flash":            (0.10, 0.40),
    "gemini-2.5-pro":              (1.25, 10.00),
    "gemini-2.5-flash":            (0.15, 0.60),
    # Ollama (lokal, kostenlos)
    "llama3.2":                    (0.0, 0.0),
    "llama3.1":                    (0.0, 0.0),
    "mistral":                     (0.0, 0.0),
    "codellama":                   (0.0, 0.0),
    "phi3":                        (0.0, 0.0),
    "qwen2.5":                     (0.0, 0.0),
    "deepseek-r1":                 (0.0, 0.0),
}

# Fallback fuer unbekannte Modelle (generous Pessimismus)
DEFAULT_INPUT_PRICE  = 5.00   # USD / 1M tokens
DEFAULT_OUTPUT_PRICE = 15.00  # USD / 1M tokens


def get_model_pricing(model: str) -> tuple[float, float]:
    """Return (input_price_per_m, output_price_per_m) for a model.
    
    Matching is case-insensitive and uses substring matching for flexibility.
    """
    model_lower = model.lower().strip()
    
    # Exakter Treffer zuerst
    for key, (inp, out) in PRICING_TABLE.items():
        if model_lower == key.lower():
            return inp, out
    
    # Substring-Matching
    for key, (inp, out) in PRICING_TABLE.items():
        if key.lower() in model_lower or model_lower in key.lower():
            return inp, out
    
    return DEFAULT_INPUT_PRICE, DEFAULT_OUTPUT_PRICE


def calculate_cost_usd(
    prompt_tokens: int,
    completion_tokens: int,
    model: str,
) -> float:
    """Berechne Kosten in USD fuer einen einzelnen LLM-Call."""
    input_price, output_price = get_model_pricing(model)
    cost = (prompt_tokens * input_price + completion_tokens * output_price) / 1_000_000
    return round(cost, 8)


def estimate_cost_for_query(
    prompt_tokens: int,
    completion_tokens: int,
    model: str,
    num_llm_calls: int = 1,
) -> float:
    """Berechne Gesamtkosten fuer eine RAG-Query mit mehreren LLM-Calls."""
    return calculate_cost_usd(prompt_tokens, completion_tokens, model) * num_llm_calls
