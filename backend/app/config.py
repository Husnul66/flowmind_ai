import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    activepieces_webhook_url: str
    database_path: Path
    activepieces_timeout_seconds: float
    frontend_origins: tuple[str, ...]
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    demo_generation_enabled: bool = False
    demo_daily_limit: int = 5
    demo_min_interval_seconds: float = 60
    gemini_timeout_seconds: float = 30


def get_settings() -> Settings:
    configured_database_path = Path(
        os.getenv("DATABASE_PATH", "./data/flowmind.db")
    )
    database_path = (
        configured_database_path
        if configured_database_path.is_absolute()
        else BACKEND_DIR / configured_database_path
    )
    frontend_origins = tuple(
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            (
                "http://localhost:5173,http://127.0.0.1:5173,"
                "http://localhost:5174,http://127.0.0.1:5174"
            ),
        ).split(",")
        if origin.strip()
    )
    generation_enabled = os.getenv("DEMO_GENERATION_ENABLED", "false").strip().lower()

    return Settings(
        activepieces_webhook_url=os.getenv("ACTIVEPIECES_WEBHOOK_URL", "").strip(),
        database_path=database_path,
        activepieces_timeout_seconds=float(
            os.getenv("ACTIVEPIECES_TIMEOUT_SECONDS", "8")
        ),
        frontend_origins=frontend_origins,
        gemini_api_key=os.getenv("GEMINI_API_KEY", "").strip(),
        gemini_model=(
            os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
            or "gemini-2.5-flash"
        ),
        demo_generation_enabled=generation_enabled in {"1", "true", "yes", "on"},
        demo_daily_limit=int(os.getenv("DEMO_DAILY_LIMIT", "5")),
        demo_min_interval_seconds=float(
            os.getenv("DEMO_MIN_INTERVAL_SECONDS", "60")
        ),
        gemini_timeout_seconds=float(os.getenv("GEMINI_TIMEOUT_SECONDS", "30")),
    )
