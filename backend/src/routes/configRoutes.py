"""Config API routes - multi-provider LLM configuration."""
from __future__ import annotations

import json
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from src.services.jwtAuth import get_current_user

logger = __import__('src.config.logging', fromlist=['get_logger']).get_logger(__name__)
router = APIRouter(tags=["config"])

CHAT_HISTORY_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'chat_history')


class ConfigResponse(BaseModel):
    defaultLlmProvider: str = "gemini"
    defaultEmbeddingProvider: str = "gemini"
    effectiveEmbeddingProvider: str = "gemini"
    effectiveEmbeddingModel: str = "text-embedding-004"
    ingestionUrlMaxPages: int = 50
    runtimeModelConfigurable: bool = True
    anthropicAllowedModels: list[str] = []
    openaiAllowedModels: list[str] = []
    googleAllowedModels: list[str] = []
    customAllowedModels: list[str] = []
    ollamaAllowedModels: list[str] = []
    openaiAllowedEmbeddingModels: list[str] = []
    customAllowedEmbeddingModels: list[str] = []
    ollamaAllowedEmbeddingModels: list[str] = []
    embeddingDimension: int = 768
    embeddingConfigLocked: bool = False
    embeddingConfigFingerprint: str = ""
    backendPort: int = 8000
    customLlmUrl: str = ""
    customLlmModel: str = ""
    customLlmApiKeySet: bool = False
    customEmbeddingUrl: str = ""
    customEmbeddingModel: str = ""
    customEmbeddingApiKeySet: bool = False
    anthropicApiKeySet: bool = False
    anthropicModel: str = ""
    openaiApiKeySet: bool = False
    openaiModel: str = ""
    openaiEmbeddingModel: str = ""
    googleApiKeySet: bool = False
    googleModel: str = ""
    googleEmbeddingModel: str = ""
    ollamaUrl: str = "http://localhost:11434"
    ollamaApiKeySet: bool = False
    ollamaModel: str = ""
    ollamaEmbeddingModel: str = ""
    retrievalMinScore: float = 0.3
    hybridLexicalStrategy: str = "bm25"
    hybridCandidatePoolSize: int = 50
    hybridFusionRrfK: int = 40
    hybridVectorWeight: float = 1.0
    hybridLexicalWeight: float = 1.0
    rerankerEnabled: bool = False
    rerankerProvider: str = "cross_encoder"
    rerankerModel: str = ""
    rerankerUrl: str = ""
    rerankerApiKeySet: bool = False
    rerankerHttpHeadersTemplate: str = "{}"
    rerankerHttpBodyTemplate: str = ""
    rerankerHttpResponseResultsPath: str = "results"
    rerankerHttpResponseIndexField: str = "index"
    rerankerHttpResponseScoreField: str = "relevance_score"
    multiQueryEnabled: bool = False
    multiQueryMinQueries: int = 2
    multiQueryMaxQueries: int = 4
    multiQueryRrfK: int = 60
    multiQueryExpansionProvider: str = "gemini"
    multiQueryExpansionTemperature: float = 0.3
    multiQueryFallbackOnError: bool = True
    ingestionChunkSize: int = 1024
    ingestionChunkOverlap: int = 128
    ingestionVisionSummaryEnabled: bool = False
    ingestionVisionSummaryProvider: str = "gemini"
    ingestionVisionSummaryModel: str = ""
    ingestionVisionSummaryTimeoutSeconds: int = 45
    ingestionVisionSummaryMaxChars: int = 280
    ingestionVisionSummaryHttpUrl: str = ""
    ingestionVisionSummaryHttpApiKeySet: bool = False
    ingestionVisionSummaryHttpHeadersTemplate: str = "{}"
    ingestionVisionSummaryHttpBodyTemplate: str = ""
    ingestionVisionSummaryHttpResponseTextPath: str = "text"


class ModelConfigResponse(BaseModel):
    defaultLlmProvider: str = "gemini"
    runtimeModelConfigurable: bool = True
    anthropicAllowedModels: list[str] = []
    openaiAllowedModels: list[str] = []
    googleAllowedModels: list[str] = []
    customAllowedModels: list[str] = []
    ollamaAllowedModels: list[str] = []
    anthropicModel: str = ""
    openaiModel: str = ""
    googleModel: str = ""
    customLlmModel: str = ""
    ollamaModel: str = ""


class ConfigUpdateRequest(BaseModel):
    defaultLlmProvider: Optional[str] = None
    anthropicAllowedModels: Optional[list[str]] = None
    openaiAllowedModels: Optional[list[str]] = None
    googleAllowedModels: Optional[list[str]] = None
    ollamaAllowedModels: Optional[list[str]] = None
    customAllowedModels: Optional[list[str]] = None
    anthropicApiKey: Optional[str] = None
    anthropicModel: Optional[str] = None
    openaiApiKey: Optional[str] = None
    openaiModel: Optional[str] = None
    googleApiKey: Optional[str] = None
    googleModel: Optional[str] = None
    ollamaUrl: Optional[str] = None
    ollamaApiKey: Optional[str] = None
    ollamaModel: Optional[str] = None
    customLlmUrl: Optional[str] = None
    customLlmApiKey: Optional[str] = None
    customLlmModel: Optional[str] = None


class MyLlmConfigResponse(BaseModel):
    defaultLlmProvider: str = "gemini"
    completionLlmProvider: str = "gemini"
    titleLlmProvider: str = "gemini"
    allowModelKnowledgeFallback: bool = True
    systemPromptAddition: str = ""
    temperature: float = 0.7
    runtimeModelConfigurable: bool = True
    anthropicAllowedModels: list[str] = []
    openaiAllowedModels: list[str] = []
    googleAllowedModels: list[str] = []
    ollamaAllowedModels: list[str] = []
    customAllowedModels: list[str] = []
    anthropicModel: str = ""
    openaiModel: str = ""
    googleModel: str = ""
    ollamaModel: str = ""
    customLlmModel: str = ""
    customLlmUrl: str = ""
    ollamaUrl: str = "http://localhost:11434"


class MyLlmSecretsResponse(BaseModel):
    anthropicApiKey: str = ""
    openaiApiKey: str = ""
    googleApiKey: str = ""
    customLlmApiKey: str = ""
    ollamaApiKey: str = ""
    anthropicApiKeySet: bool = False
    openaiApiKeySet: bool = False
    googleApiKeySet: bool = False
    customLlmApiKeySet: bool = False
    ollamaApiKeySet: bool = False


@router.get("/config/models")
async def get_model_config(_user: dict = Depends(get_current_user)):
    return ModelConfigResponse()


@router.get("/config")
async def get_config(_admin: dict = Depends(get_current_user)):
    return ConfigResponse()


@router.put("/config")
async def update_config(
    body: ConfigUpdateRequest,
    persist: bool = Query(default=False),
    _admin: dict = Depends(get_current_user),
):
    logger.info("config_update_requested", persist=persist, model=body.defaultLlmProvider)
    return ConfigResponse()


@router.get("/me/llm-config")
async def get_my_llm_config(_user: dict = Depends(get_current_user)):
    return MyLlmConfigResponse()


@router.put("/me/llm-config")
async def save_my_llm_config(
    body: MyLlmConfigResponse,
    _user: dict = Depends(get_current_user),
):
    logger.info("llm_config_saved", provider=body.defaultLlmProvider)
    return body


@router.get("/me/llm-secrets")
async def get_my_llm_secrets(_user: dict = Depends(get_current_user)):
    return MyLlmSecretsResponse()


@router.put("/me/llm-secrets")
async def save_my_llm_secrets(
    body: MyLlmSecretsResponse,
    _user: dict = Depends(get_current_user),
):
    logger.info("llm_secrets_saved")
    return body


def _get_chat_history_path(user_id: str) -> str:
    os.makedirs(CHAT_HISTORY_DIR, exist_ok=True)
    return os.path.join(CHAT_HISTORY_DIR, f"{user_id}.json")


@router.get("/me/chat-history")
async def get_chat_history(user: dict = Depends(get_current_user)):
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    filepath = _get_chat_history_path(user_id)
    if not os.path.isfile(filepath):
        return {
            "schemaVersion": 1,
            "threads": [],
            "folders": [],
            "activeThreadId": None,
            "updatedAt": None,
        }
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("chat_history_read_error", user_id=user_id, error=str(e))
        return {
            "schemaVersion": 1,
            "threads": [],
            "folders": [],
            "activeThreadId": None,
            "updatedAt": None,
        }


@router.put("/me/chat-history")
async def save_chat_history(
    body: dict,
    user: dict = Depends(get_current_user),
):
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    filepath = _get_chat_history_path(user_id)
    try:
        body["updatedAt"] = body.get("updatedAt") or __import__("datetime").datetime.now().isoformat()
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(body, f, ensure_ascii=False, indent=2)
        logger.info("chat_history_saved", user_id=user_id)
        return body
    except Exception as e:
        logger.error("chat_history_save_error", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to save chat history")
