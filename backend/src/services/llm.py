from functools import lru_cache
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from src.config.index import appConfig

EMBEDDING_DIMENSIONS = 1536


@lru_cache(maxsize=1)
def _get_llm():
    return {
        "embeddings_llm": ChatOpenAI(
            model=appConfig["requesty_embeddings_llm_model"],
            api_key=appConfig["requesty_api_key"],
            base_url=appConfig["requesty_base_url"],
            temperature=0,
        ),
        "embeddings": OpenAIEmbeddings(
            model=appConfig["requesty_embeddings_model"],
            api_key=appConfig["requesty_api_key"],
            base_url=appConfig["requesty_base_url"],
            dimensions=EMBEDDING_DIMENSIONS,
        ),
        "chat_llm": ChatOpenAI(
            model=appConfig["requesty_chat_model"],
            api_key=appConfig["requesty_api_key"],
            base_url=appConfig["requesty_base_url"],
            temperature=0,
        ),
        "mini_llm": ChatOpenAI(
            model=appConfig["requesty_mini_model"],
            api_key=appConfig["requesty_api_key"],
            base_url=appConfig["requesty_base_url"],
            temperature=0,
        ),
    }


class _LazyLLM:
    def __getitem__(self, key):
        return _get_llm()[key]


llm = _LazyLLM()


def get_chat_llm(model_id: str, temperature: float = 0.0) -> ChatOpenAI:
    """Requesty-backed ChatOpenAI für eine gewählte model_id (app_models, nutzerwählbar).

    Im Gegensatz zum lru_cache-Singleton (ein festes Modell aus Env) erlaubt dies, das
    Chat-Modell pro Aufruf frei zu wählen — Grundlage für die modell-Auswahl im Chat.
    Embeddings/mini_llm bleiben global (single source of truth, KB-001).
    """
    return ChatOpenAI(
        model=model_id,
        api_key=appConfig["requesty_api_key"],
        base_url=appConfig["requesty_base_url"],
        temperature=temperature,
    )
