"""Entrypoint: ``python -m src.mcp [--transport stdio|http]``.

- ``stdio`` (Default): lokaler MCP-Client (Claude Desktop, Cursor, opencode).
- ``http``: streamable-http Server auf ``MCP_HOST:MCP_PORT`` (Remote/Web-App, docker-compose).

Wichtig: Logging geht fuer beide Transports auf stderr + Datei — stdout bleibt exklusiv
fuer das stdio-MCP-Protokoll frei (sonst korruptiert das JSON-RPC).
"""
import argparse
import logging
import sys

from src.config.logging import (
    configure_file_handler,
    configure_logging,
    get_logger,
)
from src.mcp.server import mcp

logger = get_logger(__name__)


def _configure_logging() -> None:
    """Logging auf stderr + Datei; stdout bleibt fuer das stdio-Protokoll frei."""
    configure_logging()
    root = logging.getLogger()
    root.handlers.clear()
    stderr = logging.StreamHandler(sys.stderr)
    stderr.setFormatter(logging.Formatter("%(message)s"))
    root.addHandler(stderr)
    configure_file_handler(root, "mcp.log")


def main() -> None:
    parser = argparse.ArgumentParser(description="WS-Copilot MCP-Server (agentic RAG)")
    parser.add_argument(
        "--transport",
        choices=["stdio", "http"],
        default="stdio",
        help="stdio = lokale Clients (Default); http = streamable-http (Remote/Web).",
    )
    args = parser.parse_args()
    _configure_logging()
    logger.info("mcp_server_starting", transport=args.transport)
    if args.transport == "http":
        mcp.run(transport="streamable-http")
    else:
        mcp.run()


if __name__ == "__main__":
    main()
