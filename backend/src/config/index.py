import os
from dotenv import load_dotenv

load_dotenv()

if not os.getenv("SUPABASE_API_URL") or not os.getenv("SUPABASE_SECRET_KEY"):
    raise ValueError(
        "SUPABASE_API_URL and SUPABASE_SECRET_KEY must be set in .env file"
    )

if not os.getenv("JWT_SECRET"):
    raise ValueError("JWT_SECRET must be set in .env file")

appConfig = {
    "supabase_api_url": os.getenv("SUPABASE_API_URL"),
    "supabase_secret_key": os.getenv("SUPABASE_SECRET_KEY"),
    "jwt_secret": os.getenv("JWT_SECRET"),
    "domain": os.getenv("DOMAIN", "http://localhost:5173"),
    "s3_bucket_name": os.getenv("S3_BUCKET_NAME", ""),
    "aws_region": os.getenv("AWS_REGION", ""),
    "aws_secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY", ""),
    "aws_access_key_id": os.getenv("AWS_ACCESS_KEY_ID", ""),
    "redis_url": os.getenv("REDIS_URL", ""),
    "requesty_api_key": os.getenv("REQUESTY_API_KEY", ""),
    "requesty_base_url": os.getenv("REQUESTY_BASE_URL", ""),
    "requesty_chat_model": os.getenv("REQUESTY_CHAT_MODEL", "gpt-4o"),
    "requesty_mini_model": os.getenv("REQUESTY_MINI_MODEL", "gpt-4o-mini"),
    "requesty_embeddings_model": os.getenv("REQUESTY_EMBEDDINGS_MODEL", "text-embedding-3-large"),
    "requesty_embeddings_llm_model": os.getenv("REQUESTY_EMBEDDINGS_LLM_MODEL", "gpt-4o"),
    "agent_model_id": os.getenv("AGENT_MODEL_ID", "openai:gpt-4o"),
    "mcp_service_user_id": os.getenv("MCP_SERVICE_USER_ID", ""),
    "mcp_host": os.getenv("MCP_HOST", "0.0.0.0"),
    "mcp_port": int(os.getenv("MCP_PORT", "8100")),
}
