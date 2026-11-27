from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, get_settings
from app.database import LeadDatabase
from app.routers.demos import router as demos_router
from app.routers.leads import router as leads_router
from app.services.activepieces_service import ActivepiecesService
from app.services.gemini_service import GeminiService
from app.services.lead_service import LeadService


def create_app(
    settings: Settings | None = None,
    database: LeadDatabase | None = None,
    activepieces: ActivepiecesService | None = None,
    gemini_service: GeminiService | None = None,
) -> FastAPI:
    app_settings = settings or get_settings()
    lead_database = database or LeadDatabase(app_settings.database_path)
    lead_database.initialize()
    activepieces_service = activepieces or ActivepiecesService(
        app_settings.activepieces_webhook_url,
        timeout_seconds=app_settings.activepieces_timeout_seconds,
    )
    demo_gemini_service = gemini_service or GeminiService(
        api_key=app_settings.gemini_api_key,
        model=app_settings.gemini_model,
        timeout_seconds=app_settings.gemini_timeout_seconds,
    )

    app = FastAPI(title="FlowMind AI API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(app_settings.frontend_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    app.state.lead_service = LeadService(lead_database, activepieces_service)
    app.state.settings = app_settings
    app.state.database = lead_database
    app.state.gemini_service = demo_gemini_service

    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(leads_router)
    app.include_router(demos_router)
    return app


app = create_app()
