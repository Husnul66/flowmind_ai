import json
import logging
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient
from google.genai import errors
from pydantic import ValidationError

from app.config import Settings, get_settings
from app.database import LeadDatabase
from app.main import create_app
from app.schemas import DemoResponse
from app.services.activepieces_service import ActivepiecesService
from app.services.gemini_service import GeminiService

VALID_DEMO = {
    "mini_site": {
        "brand_name": "PulseFit Stüdyo",
        "domain_slug": "pulsefit-randevu",
        "tagline": "Daha iyi hissetmek için yerini hemen ayır.",
        "accent_color": "indigo",
        "selectable_options": [
            "10:00 - Sabah Fitness",
            "14:30 - Birebir PT",
            "18:00 - Grup Pilates",
        ],
        "chat_preview": [
            {"sender": "customer", "text": "{{option}} saatini tercih ediyorum."},
            {"sender": "bot", "text": "{{option}} için kaydınızı oluşturdum."},
            {"sender": "system", "text": "Takvim ve ekip bilgilendirildi."},
        ],
        "kpi_cards": [
            {"label": "Otomatik Onay", "value": "%95"},
            {"label": "Haftalık Kazanç", "value": "+6 Saat"},
        ],
    },
    "title": "Randevu talebi otomasyonu",
    "business_problem": "Randevu talepleri farklı kanallarda manuel takip ediliyor.",
    "solution_summary": "Talepler sınıflandırılır ve uygunluk kontrolü için ekibe aktarılır.",
    "steps": [
        {
            "name": "Talebi alma",
            "description": "Müşteri mesajındaki randevu isteği kaydedilir.",
            "tool": "WhatsApp Business",
        },
        {
            "name": "Bilgileri düzenleme",
            "description": "Hizmet ve tercih edilen zaman bilgisi ayrıştırılır.",
            "tool": "Otomasyon platformu",
        },
    ],
    "benefits": ["Manuel takip adımlarının azaltılması."],
    "estimated_time_saving": "İş hacmine bağlı olarak haftalık zaman tasarrufu tahmin edilebilir.",
    "implementation_note": "Takvim erişimi ve WhatsApp Business bağlantısı gerekir.",
}


class FakeGeminiClient:
    def __init__(
        self,
        response_text: str | None = None,
        response_parsed: Any = None,
        exception: Exception | None = None,
    ) -> None:
        self.response_text = response_text
        self.response_parsed = response_parsed
        self.exception = exception
        self.calls: list[dict[str, Any]] = []
        self.models = self
        self.closed = False

    def __enter__(self) -> "FakeGeminiClient":
        return self

    def __exit__(self, *args: object) -> None:
        self.closed = True

    def generate_content(
        self,
        *,
        model: str,
        contents: str,
        config: Any,
    ) -> SimpleNamespace:
        self.calls.append(
            {"model": model, "contents": contents, "config": config}
        )
        if self.exception is not None:
            raise self.exception
        return SimpleNamespace(text=self.response_text, parsed=self.response_parsed)


def make_demo_app(
    database_path: Path,
    fake_client: FakeGeminiClient,
    *,
    enabled: bool = True,
    api_key: str = "test-api-key",
    daily_limit: int = 5,
    minimum_interval_seconds: float = 60,
) -> tuple[Any, LeadDatabase]:
    database = LeadDatabase(database_path)
    settings = Settings(
        activepieces_webhook_url="",
        database_path=database_path,
        activepieces_timeout_seconds=1,
        frontend_origins=("http://localhost:5173",),
        gemini_api_key=api_key,
        demo_generation_enabled=enabled,
        demo_daily_limit=daily_limit,
        demo_min_interval_seconds=minimum_interval_seconds,
    )
    gemini_service = GeminiService(
        api_key=api_key,
        model=settings.gemini_model,
        timeout_seconds=settings.gemini_timeout_seconds,
        client=fake_client,
    )
    app = create_app(
        settings,
        database,
        ActivepiecesService(""),
        gemini_service,
    )
    return app, database


def post_demo(client: TestClient, prompt: str = "Randevuları otomatik yönet.") -> httpx.Response:
    return client.post("/api/demos", json={"prompt": prompt})


def test_valid_prompt_returns_structured_demo_with_one_gemini_call(
    tmp_path: Path,
) -> None:
    fake_gemini = FakeGeminiClient(response_text=json.dumps(VALID_DEMO))
    app, _ = make_demo_app(tmp_path / "valid-demo.sqlite3", fake_gemini)

    with TestClient(app) as client:
        response = post_demo(client)

    assert response.status_code == 200
    assert response.json() == VALID_DEMO
    assert len(fake_gemini.calls) == 1
    call = fake_gemini.calls[0]
    assert call["model"] == "gemini-2.5-flash"
    assert call["config"].temperature == 0.2
    assert call["config"].max_output_tokens == 4096
    assert call["config"].thinking_config.thinking_budget == 0
    assert call["config"].response_mime_type == "application/json"
    assert call["config"].response_json_schema is not None
    assert call["config"].tools is None

    def contains_additional_properties(value: Any) -> bool:
        if isinstance(value, dict):
            return "additionalProperties" in value or any(
                contains_additional_properties(nested)
                for nested in value.values()
            )
        if isinstance(value, list):
            return any(contains_additional_properties(item) for item in value)
        return False

    assert not contains_additional_properties(call["config"].response_json_schema)
    assert contains_additional_properties(DemoResponse.model_json_schema())


def test_parsed_sdk_response_is_validated_without_text(
    tmp_path: Path,
) -> None:
    fake_gemini = FakeGeminiClient(response_parsed=VALID_DEMO)
    app, _ = make_demo_app(tmp_path / "parsed-demo.sqlite3", fake_gemini)

    with TestClient(app) as client:
        response = post_demo(client)

    assert response.status_code == 200
    assert response.json() == VALID_DEMO


@pytest.mark.parametrize(
    ("field", "invalid_value"),
    [
        ("selectable_options", ["10:00", "14:30"]),
        ("chat_preview", [{"sender": "customer", "text": "Seçim"}]),
        (
            "kpi_cards",
            [
                {"label": "Onay", "value": "%95"},
                {"label": "Kazanç", "value": "+6 Saat"},
                {"label": "Hız", "value": "Hızlı"},
            ],
        ),
    ],
)
def test_mini_site_requires_exact_interaction_cardinality(
    field: str,
    invalid_value: list[dict[str, str]] | list[str],
) -> None:
    payload = json.loads(json.dumps(VALID_DEMO))
    payload["mini_site"][field] = invalid_value

    with pytest.raises(ValidationError):
        DemoResponse.model_validate(payload)


def test_mini_site_chat_messages_follow_customer_bot_system_order() -> None:
    payload = json.loads(json.dumps(VALID_DEMO))
    payload["mini_site"]["chat_preview"][2]["sender"] = "bot"

    with pytest.raises(ValidationError):
        DemoResponse.model_validate(payload)


def test_gemini_sdk_uses_timeout_and_disables_retries(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client = FakeGeminiClient(response_text=json.dumps(VALID_DEMO))
    client_options: dict[str, Any] = {}

    def make_client(**kwargs: Any) -> FakeGeminiClient:
        client_options.update(kwargs)
        return fake_client

    monkeypatch.setattr("app.services.gemini_service.genai.Client", make_client)
    service = GeminiService(
        api_key="test-api-key",
        model="gemini-2.5-flash",
        timeout_seconds=12,
    )

    service.generate_demo("İş akışımı otomatikleştir.")

    http_options = client_options["http_options"]
    assert http_options.timeout == 12_000
    assert http_options.retry_options.attempts == 1
    assert len(fake_client.calls) == 1
    assert fake_client.closed


def test_generation_settings_are_disabled_with_expected_defaults(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    for key in (
        "GEMINI_API_KEY",
        "GEMINI_MODEL",
        "DEMO_GENERATION_ENABLED",
        "DEMO_DAILY_LIMIT",
        "DEMO_MIN_INTERVAL_SECONDS",
        "GEMINI_TIMEOUT_SECONDS",
    ):
        monkeypatch.delenv(key, raising=False)

    settings = get_settings()

    assert settings.gemini_api_key == ""
    assert settings.gemini_model == "gemini-2.5-flash"
    assert settings.demo_generation_enabled is False
    assert settings.demo_daily_limit == 5


def test_frontend_url_is_added_to_cors_origins(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("FRONTEND_ORIGINS", "http://localhost:5173")
    monkeypatch.setenv(
        "FRONTEND_URL",
        "https://flowmind-ai.vercel.app/, https://preview.vercel.app",
    )

    settings = get_settings()

    assert settings.frontend_origins == (
        "http://localhost:5173",
        "https://flowmind-ai.vercel.app",
        "https://preview.vercel.app",
    )


@pytest.mark.parametrize("prompt", ["", "   ", "a" * 1001, "a" * 1000 + " "])
def test_invalid_prompt_does_not_call_gemini(
    tmp_path: Path,
    prompt: str,
) -> None:
    fake_gemini = FakeGeminiClient(response_text=json.dumps(VALID_DEMO))
    app, _ = make_demo_app(tmp_path / "invalid-prompt.sqlite3", fake_gemini)

    with TestClient(app) as client:
        response = post_demo(client, prompt)

    assert response.status_code == 422
    assert fake_gemini.calls == []


def test_invalid_gemini_response_returns_safe_error_and_logs_type(
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
) -> None:
    fake_gemini = FakeGeminiClient(
        response_text='{"title": "Eksik yanıt"}',
    )
    app, _ = make_demo_app(tmp_path / "invalid-output.sqlite3", fake_gemini)

    with caplog.at_level(logging.ERROR, logger="app.routers.demos"):
        with TestClient(app) as client:
            response = post_demo(client)

    assert response.status_code == 502
    assert "API key" not in response.text
    assert "Traceback" not in response.text
    assert "reason=schema_validation" in caplog.text
    assert "missing" in caplog.text
    assert "Eksik yanıt" not in caplog.text


def test_malformed_gemini_json_returns_bad_gateway(
    tmp_path: Path,
) -> None:
    fake_gemini = FakeGeminiClient(response_text='{"title": ')
    app, _ = make_demo_app(tmp_path / "malformed-output.sqlite3", fake_gemini)

    with TestClient(app) as client:
        response = post_demo(client)

    assert response.status_code == 502
    assert response.json()["detail"] == "AI servisi geçerli bir demo yanıtı üretemedi."
    assert len(fake_gemini.calls) == 1


def test_missing_api_key_returns_configuration_error_without_call(
    tmp_path: Path,
) -> None:
    fake_gemini = FakeGeminiClient(response_text=json.dumps(VALID_DEMO))
    app, _ = make_demo_app(
        tmp_path / "missing-key.sqlite3",
        fake_gemini,
        api_key="",
    )

    with TestClient(app) as client:
        response = post_demo(client)

    assert response.status_code == 503
    assert "API anahtarı" in response.json()["detail"]
    assert fake_gemini.calls == []


def test_generation_is_disabled_by_default(tmp_path: Path) -> None:
    fake_gemini = FakeGeminiClient(response_text=json.dumps(VALID_DEMO))
    app, _ = make_demo_app(
        tmp_path / "disabled.sqlite3",
        fake_gemini,
        enabled=False,
    )

    with TestClient(app) as client:
        response = post_demo(client)

    assert response.status_code == 503
    assert fake_gemini.calls == []


def test_gemini_timeout_returns_gateway_timeout(tmp_path: Path) -> None:
    fake_gemini = FakeGeminiClient(exception=httpx.ReadTimeout("mock timeout"))
    app, database = make_demo_app(tmp_path / "timeout.sqlite3", fake_gemini)

    with TestClient(app) as client:
        response = post_demo(client)

    assert response.status_code == 504
    assert fake_gemini.calls
    assert database.path.exists()


def test_gemini_rate_limit_returns_too_many_requests(
    tmp_path: Path,
) -> None:
    fake_gemini = FakeGeminiClient(
        exception=errors.APIError(429, {"error": {"message": "rate limited"}})
    )
    app, _ = make_demo_app(tmp_path / "provider-rate-limit.sqlite3", fake_gemini)

    with TestClient(app) as client:
        response = post_demo(client)

    assert response.status_code == 429
    assert "geçici istek sınırına" in response.json()["detail"]


def test_provider_error_logs_safe_code_and_message_without_sensitive_data(
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
) -> None:
    secret_key = "test-gemini-secret-key"
    user_prompt = "Müşteriye özel gizli talep metni"
    fake_gemini = FakeGeminiClient(
        exception=errors.APIError(
            400,
            {"error": {"message": f"Rejected: {secret_key} {user_prompt}"}},
        )
    )
    app, _ = make_demo_app(
        tmp_path / "provider-error-log.sqlite3",
        fake_gemini,
        api_key=secret_key,
        minimum_interval_seconds=0,
    )

    with caplog.at_level(logging.ERROR, logger="app.routers.demos"):
        with TestClient(app) as client:
            response = post_demo(client, user_prompt)

    assert response.status_code == 502
    assert response.json()["detail"] == (
        "Demo şu anda oluşturulamadı. Lütfen daha sonra tekrar deneyin."
    )
    assert "code=400" in caplog.text
    assert "schema was rejected" in caplog.text
    assert secret_key not in caplog.text
    assert user_prompt not in caplog.text


def test_daily_generation_limit_blocks_additional_gemini_calls(
    tmp_path: Path,
) -> None:
    fake_gemini = FakeGeminiClient(response_text=json.dumps(VALID_DEMO))
    app, _ = make_demo_app(
        tmp_path / "daily-limit.sqlite3",
        fake_gemini,
        daily_limit=1,
        minimum_interval_seconds=0,
    )

    with TestClient(app) as client:
        first_response = post_demo(client)
    with TestClient(app, client=("192.0.2.1", 12345)) as different_client:
        second_response = post_demo(different_client)

    assert first_response.status_code == 200
    assert second_response.status_code == 429
    assert "demo oluşturma sınırına" in second_response.json()["detail"]
    assert len(fake_gemini.calls) == 1


def test_minimum_interval_blocks_same_client(tmp_path: Path) -> None:
    fake_gemini = FakeGeminiClient(response_text=json.dumps(VALID_DEMO))
    app, _ = make_demo_app(
        tmp_path / "minimum-interval.sqlite3",
        fake_gemini,
        minimum_interval_seconds=60,
    )

    with TestClient(app) as client:
        first_response = post_demo(client)
        second_response = post_demo(client)

    assert first_response.status_code == 200
    assert second_response.status_code == 429
    assert int(second_response.headers["retry-after"]) > 0
    assert len(fake_gemini.calls) == 1


def test_forwarded_for_first_ip_is_used_for_minimum_interval(
    tmp_path: Path,
) -> None:
    fake_gemini = FakeGeminiClient(response_text=json.dumps(VALID_DEMO))
    app, _ = make_demo_app(
        tmp_path / "forwarded-for.sqlite3",
        fake_gemini,
        minimum_interval_seconds=60,
    )
    forwarded_ip = "203.0.113.10"

    with TestClient(app, client=("192.0.2.1", 12345)) as first_client:
        first_response = first_client.post(
            "/api/demos",
            json={"prompt": "Randevuları otomatik yönet."},
            headers={"X-Forwarded-For": f"{forwarded_ip}, 198.51.100.1"},
        )
    with TestClient(app, client=("192.0.2.2", 12345)) as second_client:
        second_response = second_client.post(
            "/api/demos",
            json={"prompt": "Randevuları otomatik yönet."},
            headers={"X-Forwarded-For": f"{forwarded_ip}, 198.51.100.2"},
        )

    assert first_response.status_code == 200
    assert second_response.status_code == 429
    assert len(fake_gemini.calls) == 1
