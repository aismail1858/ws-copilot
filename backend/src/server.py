from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.authRoutes import router as authRoutes

from src.routes.projectRoutes import router as projectRoutes
from src.routes.projectFilesRoutes import router as projectFilesRoutes
from src.routes.chatRoutes import router as chatRoutes
from src.routes.rbacRoutes import router as rbacRoutes
from src.routes.modelRoutes import router as modelRoutes
from src.routes.configRoutes import router as configRoutes
from src.routes.ragRoutes import router as ragRoutes
from src.config.logging import configure_logging, get_logger
from src.middleware.logging_middleware import LoggingMiddleware

# Configure logging before anything else
configure_logging()
logger = get_logger(__name__)

logger.info("initializing_application", version="1.0.0")

# Create FastAPI app
app = FastAPI(
    title="WS-Copilot API",
    description="Backend API for WS-Copilot",
    version="1.0.0",
)

# Add logging middleware (should be first to capture all requests)
app.add_middleware(LoggingMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("middleware_configured")

app.include_router(authRoutes, prefix="/api")
app.include_router(projectRoutes, prefix="/api/projects")
app.include_router(projectFilesRoutes, prefix="/api/projects")
app.include_router(chatRoutes, prefix="/api/chats")
app.include_router(rbacRoutes, prefix="/api/rbac")
app.include_router(modelRoutes, prefix="/api")
app.include_router(configRoutes, prefix="/api/v1")
app.include_router(ragRoutes, prefix="/api/v1")

logger.info("routes_registered", route_count=8)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    logger.debug("health_check_called")
    return {"status": "healthy", "version": "1.0.0"}


logger.info("application_ready")
