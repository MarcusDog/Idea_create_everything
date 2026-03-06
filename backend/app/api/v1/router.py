"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1 import projects, nodes, chat, ai, search, configs, tree, backup

api_router = APIRouter()

api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(nodes.router, prefix="/nodes", tags=["nodes"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(configs.router, prefix="/configs", tags=["configs"])
api_router.include_router(tree.router, prefix="/tree", tags=["tree"])
api_router.include_router(backup.router, prefix="/backup", tags=["backup"])
