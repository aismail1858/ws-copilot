"""LLM-related constants."""
from __future__ import annotations

# Generation defaults
DEFAULT_TEMPERATURE: float = 0.7
DEFAULT_MAX_TOKENS: int = 2048

# System prompt
DEFAULT_SYSTEM_PROMPT = "Du bist ein hilfreicher KI-Assistent für Low-Code Entwicklung."

# LLM Provider timeouts
DEFAULT_LLM_TIMEOUT_SECONDS = 20
OLLAMA_LLM_TIMEOUT_SECONDS = 120.0

# Vision model constants
VISION_TEMPERATURE = 0.1
VISION_MAX_OUTPUT_TOKENS = 150

# HTTP Client timeouts
HTTP_CONNECT_TIMEOUT_SECONDS = 5.0
HTTP_READ_TIMEOUT_SECONDS = 20.0
EMBEDDING_TIMEOUT_SECONDS = 30
RETRIEVAL_IMAGE_FETCH_TIMEOUT_SECONDS = 10.0
CRAWLER_IMAGE_FETCH_TIMEOUT_SECONDS = 20

# RAG stream liveness.
# The frontend aborts an SSE stream after SSE_INACTIVITY_TIMEOUT_MS (webapp, 120s)
# of receiving no bytes. While the LLM is slow to produce its first token (overloaded
# model, oversized prompt, or provider keepalives that defeat the SDK read-timeout),
# the route emits periodic SSE comment frames so the client timer resets.
RAG_STREAM_HEARTBEAT_INTERVAL_SECONDS = 15.0
# Safety net: if the pipeline emits no event at all for this long, stop and send a
# clear error instead of heartbeating forever. Kept under the 120s client timer so a
# clean error wins the race.
RAG_STREAM_NO_ACTIVITY_DEADLINE_SECONDS = 100.0

# Upper bound on the retrieved context fed to the generator, in estimated tokens.
# Generous on purpose: only trims pathological prompt sizes (many/large chunks) that
# blow up time-to-first-token; normal queries stay untouched. Reuses estimate_text_tokens.
RAG_CONTEXT_TOKEN_BUDGET = 16000
