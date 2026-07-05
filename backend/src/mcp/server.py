"""FastMCP-Server-Instanz + Tool-Registrierung.

Transports (ADR-003): stdio (lokale Clients) und streamable-http (Remote/Web).
Die Tool-Logik inkl. RBAC lebt in ``rag_tools.py``; hier werden nur die Tools registriert.
"""
from mcp.server.fastmcp import FastMCP

from src.config.index import appConfig
from src.mcp.rag_tools import ask_rag, list_projects, search_documents

mcp = FastMCP(
    "ws-copilot-rag",
    host=appConfig["mcp_host"],
    port=appConfig["mcp_port"],
    instructions=(
        "WS-Copilot agentic RAG. Ablauf: (1) list_projects -> verfuegbare project_id holen, "
        "(2) ask_rag(question, project_id) fuer eine beantwortete Frage inkl. Zitierungen, "
        "oder search_documents(query, project_id) fuer eine reine Quellensuche ohne LLM-Antwort."
    ),
)

mcp.tool()(ask_rag)
mcp.tool()(search_documents)
mcp.tool()(list_projects)
