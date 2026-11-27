import hashlib
import logging

from fastapi import APIRouter, HTTPException, Request

from app.database import (
    DemoDailyLimitReached,
    DemoMinimumIntervalNotElapsed,
)
from app.schemas import DemoCreate, DemoResponse
from app.services.gemini_service import (
    GeminiInvalidResponseError,
    GeminiProviderError,
    GeminiRateLimitError,
    GeminiTimeoutError,
)

router = APIRouter(prefix="/api", tags=["demos"])
logger = logging.getLogger(__name__)


@router.post(
    "/demos",
    response_model=DemoResponse,
    summary="Generate an automation demo",
)
def create_demo(payload: DemoCreate, request: Request) -> DemoResponse:
    settings = request.app.state.settings
    gemini_service = request.app.state.gemini_service

    if not settings.demo_generation_enabled:
        raise HTTPException(
            status_code=503,
            detail="AI demo oluşturma şu anda kapalı.",
        )
    if not gemini_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Gemini API anahtarı backend ortamında yapılandırılmalıdır.",
        )

    forwarded_for = request.headers.get("X-Forwarded-For", "")
    client_host = forwarded_for.split(",", 1)[0].strip()
    if not client_host:
        client_host = request.client.host if request.client is not None else "unknown"
    client_hash = hashlib.sha256(client_host.encode("utf-8")).hexdigest()
    try:
        request.app.state.database.reserve_demo_generation(
            client_hash=client_hash,
            daily_limit=settings.demo_daily_limit,
            minimum_interval_seconds=settings.demo_min_interval_seconds,
        )
    except DemoDailyLimitReached as error:
        raise HTTPException(
            status_code=429,
            detail="Bugünkü demo oluşturma sınırına ulaşıldı.",
        ) from error
    except DemoMinimumIntervalNotElapsed as error:
        raise HTTPException(
            status_code=429,
            detail=f"Yeni bir demo istemeden önce {error.retry_after_seconds} saniye bekleyin.",
            headers={"Retry-After": str(error.retry_after_seconds)},
        ) from error

    try:
        return gemini_service.generate_demo(payload.prompt)
    except GeminiRateLimitError as error:
        raise HTTPException(
            status_code=429,
            detail="Gemini servisinin geçici istek sınırına ulaşıldı.",
        ) from error
    except GeminiTimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail="Demo oluşturma zaman aşımına uğradı. Daha sonra tekrar deneyin.",
        ) from error
    except GeminiInvalidResponseError as error:
        logger.error(
            "Gemini structured response invalid; reason=%s; validation_error_types=%s",
            error.reason,
            ",".join(error.validation_error_types) or "none",
        )
        raise HTTPException(
            status_code=502,
            detail="AI servisi geçerli bir demo yanıtı üretemedi.",
        ) from error
    except GeminiProviderError as error:
        logger.error(
            "Gemini provider failure; code=%s; message=%s",
            error.error_code,
            error.safe_message,
        )
        raise HTTPException(
            status_code=502,
            detail="Demo şu anda oluşturulamadı. Lütfen daha sonra tekrar deneyin.",
        ) from error
