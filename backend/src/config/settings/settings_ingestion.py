from __future__ import annotations

from typing import Annotated, Literal, Self

from pydantic import Field, field_validator, model_validator
from pydantic_settings import NoDecode


class IngestionSettingsMixin:
    ingestion_startup_policy: Literal["degraded", "strict"] = Field(
        default="degraded",
        alias="INGESTION_STARTUP_POLICY",
    )
    ingestion_require_worker_on_startup: bool = Field(
        default=False,
        alias="INGESTION_REQUIRE_WORKER_ON_STARTUP",
    )
    ingestion_worker_startup_timeout_seconds: int = Field(
        default=45,
        alias="INGESTION_WORKER_STARTUP_TIMEOUT_SECONDS",
    )
    ingestion_worker_probe_interval_seconds: float = Field(
        default=1.5,
        alias="INGESTION_WORKER_PROBE_INTERVAL_SECONDS",
    )
    ingestion_worker_health_timeout_seconds: float = Field(
        default=4.0,
        alias="INGESTION_WORKER_HEALTH_TIMEOUT_SECONDS",
    )
    ingestion_worker_health_retries: int = Field(
        default=1,
        alias="INGESTION_WORKER_HEALTH_RETRIES",
    )
    ingestion_worker_health_min_successes: int = Field(
        default=1,
        alias="INGESTION_WORKER_HEALTH_MIN_SUCCESSES",
    )
    ingestion_max_upload_bytes: int = Field(
        default=25 * 1024 * 1024,
        alias="INGESTION_MAX_UPLOAD_BYTES",
    )
    ingestion_inline_payload_max_bytes: int = Field(
        default=2 * 1024 * 1024,
        alias="INGESTION_INLINE_PAYLOAD_MAX_BYTES",
    )
    ingestion_max_content_chars: int = Field(
        default=400_000,
        alias="INGESTION_MAX_CONTENT_CHARS",
    )
    ingestion_docling_parse_timeout_seconds: int = Field(
        default=1800,
        alias="INGESTION_DOCLING_PARSE_TIMEOUT_SECONDS",
    )
    ingestion_docling_pdf_ocr_enabled: bool = Field(
        default=False,
        alias="INGESTION_DOCLING_PDF_OCR_ENABLED",
    )
    ingestion_docling_pdf_tables_enabled: bool = Field(
        default=True,
        alias="INGESTION_DOCLING_PDF_TABLES_ENABLED",
    )
    ingestion_image_summary_chunks_enabled: bool = Field(
        default=True,
        alias="INGESTION_IMAGE_SUMMARY_CHUNKS_ENABLED",
    )
    ingestion_vision_summary_enabled: bool = Field(
        default=False,
        alias="INGESTION_VISION_SUMMARY_ENABLED",
    )
    ingestion_vision_summary_provider: Literal["gemini", "openai", "ollama", "custom", "http"] = Field(
        default="gemini",
        alias="INGESTION_VISION_SUMMARY_PROVIDER",
    )
    ingestion_vision_summary_model: str = Field(default="", alias="INGESTION_VISION_SUMMARY_MODEL")
    ingestion_vision_summary_timeout_seconds: int = Field(
        default=45,
        alias="INGESTION_VISION_SUMMARY_TIMEOUT_SECONDS",
    )
    ingestion_vision_summary_max_chars: int = Field(
        default=280,
        alias="INGESTION_VISION_SUMMARY_MAX_CHARS",
    )
    ingestion_vision_summary_http_url: str = Field(
        default="",
        alias="INGESTION_VISION_SUMMARY_HTTP_URL",
    )
    ingestion_vision_summary_http_api_key: str = Field(
        default="",
        alias="INGESTION_VISION_SUMMARY_HTTP_API_KEY",
    )
    ingestion_vision_summary_http_headers_template: str = Field(
        default="{}",
        alias="INGESTION_VISION_SUMMARY_HTTP_HEADERS_TEMPLATE",
    )
    ingestion_vision_summary_http_body_template: str = Field(
        default='{"model":"{{model}}","prompt":"{{prompt}}","image":"{{image_base64}}"}',
        alias="INGESTION_VISION_SUMMARY_HTTP_BODY_TEMPLATE",
    )
    ingestion_vision_summary_http_response_text_path: str = Field(
        default="text",
        alias="INGESTION_VISION_SUMMARY_HTTP_RESPONSE_TEXT_PATH",
    )
    ingestion_max_image_summaries_per_document: int = Field(
        default=20,
        alias="INGESTION_MAX_IMAGE_SUMMARIES_PER_DOCUMENT",
    )
    ingestion_document_soft_time_limit_seconds: int = Field(
        default=3600,
        alias="INGESTION_DOCUMENT_SOFT_TIME_LIMIT_SECONDS",
    )
    ingestion_document_time_limit_seconds: int = Field(
        default=3660,
        alias="INGESTION_DOCUMENT_TIME_LIMIT_SECONDS",
    )
    ingestion_url_soft_time_limit_seconds: int = Field(
        default=7200,
        alias="INGESTION_URL_SOFT_TIME_LIMIT_SECONDS",
    )
    ingestion_url_time_limit_seconds: int = Field(
        default=7260,
        alias="INGESTION_URL_TIME_LIMIT_SECONDS",
    )
    ingestion_chunk_size_min: int = Field(default=128, alias="INGESTION_CHUNK_SIZE_MIN")
    ingestion_chunk_size_max: int = Field(default=4000, alias="INGESTION_CHUNK_SIZE_MAX")
    ingestion_chunk_overlap_max: int = Field(default=1024, alias="INGESTION_CHUNK_OVERLAP_MAX")
    ingestion_chunk_size_default: int = Field(default=1024, alias="INGESTION_CHUNK_SIZE_DEFAULT")
    ingestion_chunk_overlap_default: int = Field(default=128, alias="INGESTION_CHUNK_OVERLAP_DEFAULT")
    ingestion_semantic_chunking_enabled: bool = Field(default=False, alias="INGESTION_SEMANTIC_CHUNKING_ENABLED")
    ingestion_url_max_depth: int = Field(default=5, alias="INGESTION_URL_MAX_DEPTH")
    ingestion_url_max_pages: int = Field(
        default=1200,
        alias="INGESTION_URL_MAX_PAGES",
        ge=1,
        le=1200,
    )
    ingestion_reject_empty_parse: bool = Field(default=True, alias="INGESTION_REJECT_EMPTY_PARSE")
    ingest_url_block_private_networks: bool = Field(
        default=True,
        alias="INGEST_URL_BLOCK_PRIVATE_NETWORKS",
    )
    ingest_url_allowed_hosts: Annotated[list[str], NoDecode] = Field(
        default_factory=list,
        alias="INGEST_URL_ALLOWED_HOSTS",
    )
    retrieval_min_score: float = Field(default=0.10, alias="RETRIEVAL_MIN_SCORE")
    own_entity_names: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["Wertschoepfer", "Wertschöpfer", "WS Copilot", "ws-copilot"],
        alias="OWN_ENTITY_NAMES",
    )
    hybrid_lexical_strategy: Literal["bm25", "fts"] = Field(
        default="bm25",
        alias="HYBRID_LEXICAL_STRATEGY",
    )
    hybrid_fts_language: str = Field(
        default="german",
        alias="HYBRID_FTS_LANGUAGE",
    )
    hybrid_candidate_pool_size: int = Field(default=50, alias="HYBRID_CANDIDATE_POOL_SIZE")
    hybrid_fusion_rrf_k: int = Field(default=40, alias="HYBRID_FUSION_RRF_K")
    hybrid_vector_weight: float = Field(default=1.0, alias="HYBRID_VECTOR_WEIGHT")
    hybrid_lexical_weight: float = Field(default=1.0, alias="HYBRID_LEXICAL_WEIGHT")
    hnsw_ef_search: int = Field(default=100, alias="HNSW_EF_SEARCH")
    reranker_enabled: bool = Field(default=True, alias="RERANKER_ENABLED")
    reranker_provider: Literal["cross_encoder", "http", "custom"] = Field(
        default="cross_encoder",
        alias="RERANKER_PROVIDER",
    )
    reranker_model: str = Field(default="BAAI/bge-reranker-v2-m3", alias="RERANKER_MODEL")
    reranker_url: str = Field(default="", alias="RERANKER_URL")
    reranker_api_key: str = Field(default="", alias="RERANKER_API_KEY")
    reranker_http_headers_template: str = Field(default="{}", alias="RERANKER_HTTP_HEADERS_TEMPLATE")
    reranker_http_body_template: str = Field(
        default='{"query":"{{query}}","documents":"{{documents}}","top_n":"{{top_n}}","model":"{{model}}","return_documents":false}',
        alias="RERANKER_HTTP_BODY_TEMPLATE",
    )
    reranker_http_response_results_path: str = Field(
        default="results",
        alias="RERANKER_HTTP_RESPONSE_RESULTS_PATH",
    )
    reranker_http_response_index_field: str = Field(
        default="index",
        alias="RERANKER_HTTP_RESPONSE_INDEX_FIELD",
    )
    reranker_http_response_score_field: str = Field(
        default="relevance_score",
        alias="RERANKER_HTTP_RESPONSE_SCORE_FIELD",
    )
    reranker_candidate_cap: int = Field(default=50, alias="RERANKER_CANDIDATE_CAP")
    reranker_result_cap: int = Field(default=15, alias="RERANKER_RESULT_CAP")
    reranker_timeout_seconds: float = Field(default=5.0, alias="RERANKER_TIMEOUT_SECONDS")
    reranker_connect_timeout_seconds: float = Field(
        default=2.0,
        alias="RERANKER_CONNECT_TIMEOUT_SECONDS",
    )
    multi_query_enabled: bool = Field(default=True, alias="MULTI_QUERY_ENABLED")
    multi_query_min_queries: int = Field(default=2, alias="MULTI_QUERY_MIN_QUERIES")
    multi_query_max_queries: int = Field(default=4, alias="MULTI_QUERY_MAX_QUERIES")
    multi_query_rrf_k: int = Field(default=60, alias="MULTI_QUERY_RRF_K")
    multi_query_expansion_provider: Literal["claude", "openai", "gemini", "ollama", "custom"] = Field(
        default="gemini",
        alias="MULTI_QUERY_EXPANSION_PROVIDER",
    )
    multi_query_expansion_temperature: float = Field(
        default=0.3,
        alias="MULTI_QUERY_EXPANSION_TEMPERATURE",
    )
    multi_query_fallback_on_error: bool = Field(
        default=True,
        alias="MULTI_QUERY_FALLBACK_ON_ERROR",
    )
    followup_query_condense_enabled: bool = Field(default=True, alias="FOLLOWUP_QUERY_CONDENSE_ENABLED")
    followup_query_condense_provider: Literal["claude", "openai", "gemini", "ollama", "custom"] = Field(
        default="gemini",
        alias="FOLLOWUP_QUERY_CONDENSE_PROVIDER",
    )
    followup_query_condense_temperature: float = Field(default=0.0, alias="FOLLOWUP_QUERY_CONDENSE_TEMPERATURE")
    intent_decomposition_enabled: bool = Field(default=True, alias="INTENT_DECOMPOSITION_ENABLED")
    intent_decomposition_provider: str = Field(default="", alias="INTENT_DECOMPOSITION_PROVIDER")
    intent_decomposition_temperature: float = Field(default=0.0, alias="INTENT_DECOMPOSITION_TEMPERATURE")
    corrective_retrieval_judge_enabled: bool = Field(default=True, alias="CORRECTIVE_RETRIEVAL_JUDGE_ENABLED")
    corrective_retrieval_judge_provider: str = Field(default="", alias="CORRECTIVE_RETRIEVAL_JUDGE_PROVIDER")
    corrective_retrieval_judge_temperature: float = Field(default=0.0, alias="CORRECTIVE_RETRIEVAL_JUDGE_TEMPERATURE")
    corrective_retrieval_judge_max_iterations: int = Field(default=2, alias="CORRECTIVE_RETRIEVAL_JUDGE_MAX_ITERATIONS")
    docname_search_enabled: bool = Field(default=True, alias="DOCNAME_SEARCH_ENABLED")
    docname_fuzzy_threshold: float = Field(default=0.70, alias="DOCNAME_FUZZY_THRESHOLD")
    docname_fallback_enabled: bool = Field(default=True, alias="DOCNAME_FALLBACK_ENABLED")
    rag_claim_verifier_enabled: bool = Field(default=True, alias="RAG_CLAIM_VERIFIER_ENABLED")
    rag_claim_verifier_provider: Literal["deterministic", "http"] = Field(
        default="deterministic",
        alias="RAG_CLAIM_VERIFIER_PROVIDER",
    )
    rag_claim_verifier_url: str = Field(default="", alias="RAG_CLAIM_VERIFIER_URL")
    rag_claim_verifier_api_key: str = Field(default="", alias="RAG_CLAIM_VERIFIER_API_KEY")
    rag_claim_verifier_timeout_seconds: float = Field(
        default=8.0,
        alias="RAG_CLAIM_VERIFIER_TIMEOUT_SECONDS",
    )
    rag_claim_verifier_min_overlap_ratio: float = Field(
        default=0.25,
        alias="RAG_CLAIM_VERIFIER_MIN_OVERLAP_RATIO",
    )
    rag_fast_live_streaming_enabled: bool = Field(
        default=False,
        alias="RAG_FAST_LIVE_STREAMING_ENABLED",
    )
    rag_ttft_target_seconds: float = Field(
        default=2.0,
        alias="RAG_TTFT_TARGET_SECONDS",
    )
    rag_fast_live_postcheck_timeout_seconds: float = Field(
        default=8.0,
        alias="RAG_FAST_LIVE_POSTCHECK_TIMEOUT_SECONDS",
    )
    rag_support_gate_top_score: float = Field(
        default=0.35,
        alias="RAG_SUPPORT_GATE_TOP_SCORE",
    )
    rag_support_gate_top3_sum: float = Field(
        default=0.70,
        alias="RAG_SUPPORT_GATE_TOP3_SUM",
    )
    rag_support_gate_metadata_score_docs_only: float = Field(
        default=0.30,
        alias="RAG_SUPPORT_GATE_METADATA_SCORE_DOCS_ONLY",
    )
    rag_support_gate_metadata_score: float = Field(
        default=0.35,
        alias="RAG_SUPPORT_GATE_METADATA_SCORE",
    )
    rag_support_gate_metadata_grounded: float = Field(
        default=0.40,
        alias="RAG_SUPPORT_GATE_METADATA_GROUNDED",
    )
    rag_filter_keep_top_score: float = Field(
        default=0.40,
        alias="RAG_FILTER_KEEP_TOP_SCORE",
    )
    rag_filter_keep_lexical_score: float = Field(
        default=0.25,
        alias="RAG_FILTER_KEEP_LEXICAL_SCORE",
    )
    rag_grounding_min_terms: int = Field(
        default=2,
        alias="RAG_GROUNDING_MIN_TERMS",
    )
    rag_grounding_min_overlap_ratio: float = Field(
        default=0.2,
        alias="RAG_GROUNDING_MIN_OVERLAP_RATIO",
    )
    rag_grounding_min_terms_absolute: int = Field(
        default=4,
        alias="RAG_GROUNDING_MIN_TERMS_ABSOLUTE",
    )
    retrieval_max_chunks_per_doc: int = Field(default=3, alias="RETRIEVAL_MAX_CHUNKS_PER_DOC")
    retrieval_max_chunks_per_domain: int = Field(default=5, alias="RETRIEVAL_MAX_CHUNKS_PER_DOMAIN")
    retrieval_comparison_max_chunks_per_doc: int = Field(
        default=2,
        alias="RETRIEVAL_COMPARISON_MAX_CHUNKS_PER_DOC",
    )
    retrieval_hyde_enabled: bool = Field(default=True, alias="RETRIEVAL_HYDE_ENABLED")
    retrieval_hyde_provider: str = Field(default="", alias="RETRIEVAL_HYDE_PROVIDER")
    retrieval_hyde_temperature: float = Field(default=0.0, alias="RETRIEVAL_HYDE_TEMPERATURE")
    retrieval_hyde_max_tokens: int = Field(default=220, alias="RETRIEVAL_HYDE_MAX_TOKENS")
    retrieval_hyde_fusion_weight: float = Field(default=0.8, alias="RETRIEVAL_HYDE_FUSION_WEIGHT")
    ingestion_contextual_prefix_enabled: bool = Field(default=True, alias="INGESTION_CONTEXTUAL_PREFIX_ENABLED")
    ingestion_contextual_prefix_provider: str = Field(default="", alias="INGESTION_CONTEXTUAL_PREFIX_PROVIDER")
    ingestion_contextual_prefix_model: str = Field(default="", alias="INGESTION_CONTEXTUAL_PREFIX_MODEL")
    ingestion_contextual_prefix_max_tokens: int = Field(default=120, alias="INGESTION_CONTEXTUAL_PREFIX_MAX_TOKENS")
    ingestion_contextual_prefix_document_chars: int = Field(
        default=12000,
        alias="INGESTION_CONTEXTUAL_PREFIX_DOCUMENT_CHARS",
    )
    ingestion_contextual_prefix_chunk_chars: int = Field(
        default=2000,
        alias="INGESTION_CONTEXTUAL_PREFIX_CHUNK_CHARS",
    )
    ingestion_embedding_failure_policy: Literal["fail", "fallback_zero"] = Field(
        default="fail",
        alias="INGESTION_EMBEDDING_FAILURE_POLICY",
    )

    # ── Prompt caching (provider-side) ────────────────────────────────────────
    # Marks stable system-prompt prefixes as cacheable (Anthropic cache_control /
    # OpenAI automatic prefix caching). Big cost/latency win for stable prefixes.
    prompt_cache_enabled: bool = Field(default=True, alias="PROMPT_CACHE_ENABLED")
    prompt_cache_ttl: Literal["5m", "1h"] = Field(default="1h", alias="PROMPT_CACHE_TTL")

    # ── RAG query / result cache (KB-scoped, content-addressed) ──────────────
    # Exact-match answers (query + content_key + model fingerprint) are always safe
    # to cache. Semantic lookup (embedding similarity) is opt-in and conservative.
    rag_query_cache_enabled: bool = Field(default=True, alias="RAG_QUERY_CACHE_ENABLED")
    rag_query_cache_semantic_enabled: bool = Field(
        default=True, alias="RAG_QUERY_CACHE_SEMANTIC_ENABLED"
    )
    rag_query_cache_similarity_threshold: float = Field(
        default=0.97, alias="RAG_QUERY_CACHE_SIMILARITY_THRESHOLD"
    )
    rag_query_cache_ttl_seconds: int = Field(
        default=7 * 24 * 3600, alias="RAG_QUERY_CACHE_TTL_SECONDS"
    )
    # Per-KB result/response cache for transient content (release notes, ...).
    rag_query_cache_min_ttl_seconds: int = Field(
        default=3600, alias="RAG_QUERY_CACHE_MIN_TTL_SECONDS"
    )

    # Query-embedding cache: avoids re-embedding the same query across multi-query /
    # CRAG iterations. KB-agnostic (query text is the key).
    rag_query_embedding_cache_enabled: bool = Field(
        default=True, alias="RAG_QUERY_EMBEDDING_CACHE_ENABLED"
    )
    rag_query_embedding_cache_ttl_seconds: int = Field(
        default=1800, alias="RAG_QUERY_EMBEDDING_CACHE_TTL_SECONDS"
    )

    # Retrieval-result cache: (query + KB + top_k) -> candidate rows. Invalidated
    # on ingest of the affected KB.
    rag_retrieval_result_cache_enabled: bool = Field(
        default=True, alias="RAG_RETRIEVAL_RESULT_CACHE_ENABLED"
    )
    rag_retrieval_result_cache_ttl_seconds: int = Field(
        default=300, alias="RAG_RETRIEVAL_RESULT_CACHE_TTL_SECONDS"
    )

    # ── Recency / freshness as a first-class retrieval signal ─────────────────
    # score *= exp(-lambda * age_days). Disabled by default to preserve current
    # ranking behaviour; enable once chunk lifecycle timestamps are populated.
    recency_decay_enabled: bool = Field(default=False, alias="RECENCY_DECAY_ENABLED")
    recency_decay_lambda: float = Field(default=0.01, alias="RECENCY_DECAY_LAMBDA")

    @field_validator("retrieval_min_score")
    @classmethod
    def _validate_retrieval_min_score(cls, value: float) -> float:
        if value < 0.0 or value > 2.0:
            raise ValueError("retrieval_min_score must be between 0.0 and 2.0")
        return float(value)

    @field_validator("hnsw_ef_search")
    @classmethod
    def _validate_hnsw_ef_search(cls, value: int) -> int:
        if value < 1:
            raise ValueError("hnsw_ef_search must be at least 1")
        if value > 1000:
            raise ValueError("hnsw_ef_search must not exceed 1000")
        return int(value)

    @field_validator("hybrid_candidate_pool_size")
    @classmethod
    def _validate_hybrid_candidate_pool_size(cls, value: int) -> int:
        if value < 1:
            raise ValueError("hybrid_candidate_pool_size must be at least 1")
        if value > 100:
            raise ValueError("hybrid_candidate_pool_size must not exceed 100")
        return int(value)

    @field_validator("hybrid_fusion_rrf_k")
    @classmethod
    def _validate_hybrid_fusion_rrf_k(cls, value: int) -> int:
        if value < 1:
            raise ValueError("hybrid_fusion_rrf_k must be at least 1")
        if value > 200:
            raise ValueError("hybrid_fusion_rrf_k must not exceed 200")
        return int(value)

    @field_validator("hybrid_vector_weight", "hybrid_lexical_weight")
    @classmethod
    def _validate_hybrid_weights(cls, value: float) -> float:
        if value < 0.0:
            raise ValueError("hybrid weights must be >= 0.0")
        if value > 5.0:
            raise ValueError("hybrid weights must not exceed 5.0")
        return float(value)

    @field_validator("multi_query_min_queries", "multi_query_max_queries")
    @classmethod
    def _validate_multi_query_bounds(cls, value: int) -> int:
        if value < 1:
            raise ValueError("multi_query query count must be at least 1")
        if value > 10:
            raise ValueError("multi_query query count must not exceed 10")
        return int(value)

    @field_validator("multi_query_rrf_k")
    @classmethod
    def _validate_multi_query_rrf_k(cls, value: int) -> int:
        if value < 1:
            raise ValueError("multi_query_rrf_k must be at least 1")
        if value > 200:
            raise ValueError("multi_query_rrf_k must not exceed 200")
        return int(value)

    @field_validator("multi_query_expansion_temperature")
    @classmethod
    def _validate_multi_query_expansion_temperature(cls, value: float) -> float:
        if value < 0.0 or value > 2.0:
            raise ValueError("multi_query_expansion_temperature must be between 0.0 and 2.0")
        return float(value)

    @field_validator("followup_query_condense_temperature")
    @classmethod
    def _validate_followup_query_condense_temperature(cls, value: float) -> float:
        if value < 0.0 or value > 2.0:
            raise ValueError("followup_query_condense_temperature must be between 0.0 and 2.0")
        return float(value)

    @field_validator("rag_claim_verifier_timeout_seconds")
    @classmethod
    def _validate_rag_claim_verifier_timeout_seconds(cls, value: float) -> float:
        if value < 1.0:
            raise ValueError("rag_claim_verifier_timeout_seconds must be at least 1.0")
        if value > 60.0:
            raise ValueError("rag_claim_verifier_timeout_seconds must not exceed 60.0")
        return float(value)

    @field_validator("rag_fast_live_postcheck_timeout_seconds")
    @classmethod
    def _validate_rag_fast_live_postcheck_timeout_seconds(cls, value: float) -> float:
        if value < 0.1:
            raise ValueError("rag_fast_live_postcheck_timeout_seconds must be at least 0.1")
        if value > 10.0:
            raise ValueError("rag_fast_live_postcheck_timeout_seconds must not exceed 10.0")
        return float(value)

    @field_validator("rag_ttft_target_seconds")
    @classmethod
    def _validate_rag_ttft_target_seconds(cls, value: float) -> float:
        if value < 0.1:
            raise ValueError("rag_ttft_target_seconds must be at least 0.1")
        if value > 60.0:
            raise ValueError("rag_ttft_target_seconds must not exceed 60.0")
        return float(value)

    @field_validator("reranker_candidate_cap")
    @classmethod
    def _validate_reranker_candidate_cap(cls, value: int) -> int:
        if value < 1:
            raise ValueError("reranker_candidate_cap must be at least 1")
        if value > 200:
            raise ValueError("reranker_candidate_cap must not exceed 200")
        return int(value)

    @field_validator("reranker_result_cap")
    @classmethod
    def _validate_reranker_result_cap(cls, value: int) -> int:
        if value < 1:
            raise ValueError("reranker_result_cap must be at least 1")
        if value > 50:
            raise ValueError("reranker_result_cap must not exceed 50")
        return int(value)

    @field_validator("reranker_timeout_seconds", "reranker_connect_timeout_seconds")
    @classmethod
    def _validate_reranker_timeout_seconds(cls, value: float) -> float:
        if value < 0.1:
            raise ValueError("reranker timeout must be at least 0.1 seconds")
        if value > 60.0:
            raise ValueError("reranker timeout must not exceed 60 seconds")
        return float(value)

    @field_validator("rag_claim_verifier_min_overlap_ratio")
    @classmethod
    def _validate_rag_claim_verifier_min_overlap_ratio(cls, value: float) -> float:
        if value < 0.0 or value > 1.0:
            raise ValueError("rag_claim_verifier_min_overlap_ratio must be between 0.0 and 1.0")
        return float(value)

    @field_validator(
        "rag_support_gate_top_score",
        "rag_support_gate_top3_sum",
        "rag_support_gate_metadata_score_docs_only",
        "rag_support_gate_metadata_score",
        "rag_support_gate_metadata_grounded",
        "rag_filter_keep_top_score",
        "rag_filter_keep_lexical_score",
        "rag_grounding_min_overlap_ratio",
    )
    @classmethod
    def _validate_rag_gate_scores(cls, value: float) -> float:
        if value < 0.0 or value > 2.0:
            raise ValueError("RAG gate score must be between 0.0 and 2.0")
        return float(value)

    @field_validator("rag_grounding_min_terms", "rag_grounding_min_terms_absolute")
    @classmethod
    def _validate_rag_grounding_terms(cls, value: int) -> int:
        if value < 1:
            raise ValueError("RAG grounding min terms must be at least 1")
        if value > 50:
            raise ValueError("RAG grounding min terms must not exceed 50")
        return int(value)

    @field_validator(
        "retrieval_max_chunks_per_doc",
        "retrieval_max_chunks_per_domain",
        "retrieval_comparison_max_chunks_per_doc",
    )
    @classmethod
    def _validate_retrieval_diversity_limits(cls, value: int) -> int:
        if value < 1:
            raise ValueError("retrieval diversity limits must be at least 1")
        if value > 20:
            raise ValueError("retrieval diversity limits must not exceed 20")
        return int(value)

    @field_validator("retrieval_hyde_temperature")
    @classmethod
    def _validate_retrieval_hyde_temperature(cls, value: float) -> float:
        if value < 0.0 or value > 2.0:
            raise ValueError("retrieval_hyde_temperature must be between 0.0 and 2.0")
        return float(value)

    @field_validator("retrieval_hyde_max_tokens")
    @classmethod
    def _validate_retrieval_hyde_max_tokens(cls, value: int) -> int:
        if value < 64:
            raise ValueError("retrieval_hyde_max_tokens must be at least 64")
        if value > 1000:
            raise ValueError("retrieval_hyde_max_tokens must not exceed 1000")
        return int(value)

    @field_validator("retrieval_hyde_fusion_weight")
    @classmethod
    def _validate_retrieval_hyde_fusion_weight(cls, value: float) -> float:
        if value < 0.0 or value > 5.0:
            raise ValueError("retrieval_hyde_fusion_weight must be between 0.0 and 5.0")
        return float(value)

    @field_validator("ingestion_contextual_prefix_max_tokens")
    @classmethod
    def _validate_ingestion_contextual_prefix_max_tokens(cls, value: int) -> int:
        if value < 32:
            raise ValueError("ingestion_contextual_prefix_max_tokens must be at least 32")
        if value > 500:
            raise ValueError("ingestion_contextual_prefix_max_tokens must not exceed 500")
        return int(value)

    @field_validator("intent_decomposition_temperature")
    @classmethod
    def _validate_intent_decomposition_temperature(cls, value: float) -> float:
        if value < 0.0 or value > 2.0:
            raise ValueError("intent_decomposition_temperature must be between 0.0 and 2.0")
        return float(value)

    @field_validator("corrective_retrieval_judge_temperature")
    @classmethod
    def _validate_corrective_retrieval_judge_temperature(cls, value: float) -> float:
        if value < 0.0 or value > 2.0:
            raise ValueError("corrective_retrieval_judge_temperature must be between 0.0 and 2.0")
        return float(value)

    @field_validator("corrective_retrieval_judge_max_iterations")
    @classmethod
    def _validate_corrective_retrieval_judge_max_iterations(cls, value: int) -> int:
        if value < 1:
            raise ValueError("corrective_retrieval_judge_max_iterations must be at least 1")
        if value > 5:
            raise ValueError("corrective_retrieval_judge_max_iterations must not exceed 5")
        return int(value)

    @field_validator("ingestion_contextual_prefix_document_chars", "ingestion_contextual_prefix_chunk_chars")
    @classmethod
    def _validate_ingestion_contextual_prefix_chars(cls, value: int) -> int:
        if value < 500:
            raise ValueError("ingestion_contextual_prefix char limits must be at least 500")
        if value > 50000:
            raise ValueError("ingestion_contextual_prefix char limits must not exceed 50000")
        return int(value)

    @field_validator("ingestion_max_content_chars")
    @classmethod
    def _validate_ingestion_max_content_chars(cls, value: int) -> int:
        if value < 1000:
            raise ValueError("ingestion_max_content_chars must be at least 1000")
        if value > 10_000_000:
            raise ValueError("ingestion_max_content_chars must not exceed 10000000")
        return int(value)

    @field_validator("ingestion_max_image_summaries_per_document")
    @classmethod
    def _validate_ingestion_max_image_summaries_per_document(cls, value: int) -> int:
        if value < 0:
            raise ValueError("ingestion_max_image_summaries_per_document must be >= 0")
        if value > 500:
            raise ValueError("ingestion_max_image_summaries_per_document must not exceed 500")
        return int(value)

    @field_validator("ingestion_vision_summary_timeout_seconds")
    @classmethod
    def _validate_ingestion_vision_summary_timeout_seconds(cls, value: int) -> int:
        if value < 5:
            raise ValueError("ingestion_vision_summary_timeout_seconds must be at least 5")
        if value > 180:
            raise ValueError("ingestion_vision_summary_timeout_seconds must not exceed 180")
        return int(value)

    @field_validator("ingestion_vision_summary_max_chars")
    @classmethod
    def _validate_ingestion_vision_summary_max_chars(cls, value: int) -> int:
        if value < 40:
            raise ValueError("ingestion_vision_summary_max_chars must be at least 40")
        if value > 2000:
            raise ValueError("ingestion_vision_summary_max_chars must not exceed 2000")
        return int(value)

    @field_validator("rag_query_cache_similarity_threshold")
    @classmethod
    def _validate_rag_query_cache_similarity_threshold(cls, value: float) -> float:
        if value < 0.5 or value > 1.0:
            raise ValueError(
                "rag_query_cache_similarity_threshold must be between 0.5 and 1.0"
            )
        return float(value)

    @field_validator(
        "rag_query_cache_ttl_seconds",
        "rag_query_cache_min_ttl_seconds",
        "rag_query_embedding_cache_ttl_seconds",
    )
    @classmethod
    def _validate_rag_cache_ttl_seconds(cls, value: int) -> int:
        if value < 60:
            raise ValueError("RAG cache ttl seconds must be at least 60")
        return int(value)

    @field_validator("rag_retrieval_result_cache_ttl_seconds")
    @classmethod
    def _validate_rag_retrieval_result_cache_ttl_seconds(cls, value: int) -> int:
        if value < 10:
            raise ValueError("rag_retrieval_result_cache_ttl_seconds must be at least 10")
        return int(value)

    @field_validator("recency_decay_lambda")
    @classmethod
    def _validate_recency_decay_lambda(cls, value: float) -> float:
        if value < 0.0 or value > 1.0:
            raise ValueError("recency_decay_lambda must be between 0.0 and 1.0")
        return float(value)

    @model_validator(mode="after")
    def _validate_multi_query_min_lte_max(self) -> Self:
        if int(self.multi_query_min_queries) > int(self.multi_query_max_queries):
            raise ValueError("multi_query_min_queries must be <= multi_query_max_queries")
        return self
