import json
from datetime import datetime
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.database import LeadDatabase
from app.main import create_app
from app.services.activepieces_service import ActivepiecesService


def make_payload() -> dict[str, str]:
    return {
        "fullName": "Ayşe Yılmaz",
        "companyName": "Örnek Şirket",
        "email": "ayse@example.com",
        "phone": "+90 555 000 00 00",
        "website": "",
        "selectedPackage": "Büyüme",
        "requirements": "Teklif sürecimizi otomatikleştirmek istiyoruz.",
        "submittedAt": "2026-11-26T12:00:00.000Z",
    }


def make_test_app(
    database_path: Path,
    handler: httpx.MockTransport | None = None,
    webhook_url: str = "https://activepieces.test/webhook",
):
    database = LeadDatabase(database_path)
    activepieces = ActivepiecesService(
        webhook_url,
        transport=handler,
    )
    settings = Settings(
        activepieces_webhook_url=webhook_url,
        database_path=database_path,
        activepieces_timeout_seconds=1,
        frontend_origins=(
            "http://localhost:5173",
            "http://127.0.0.1:5174",
        ),
    )
    return create_app(settings, database, activepieces), database


def test_health_endpoint_does_not_expose_configuration(tmp_path: Path) -> None:
    app, _ = make_test_app(tmp_path / "health.sqlite3")

    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert "activepieces" not in response.text.lower()


def test_vite_5174_origin_passes_cors_preflight(tmp_path: Path) -> None:
    app, _ = make_test_app(tmp_path / "cors.sqlite3")

    with TestClient(app) as client:
        response = client.options(
            "/api/leads",
            headers={
                "Origin": "http://127.0.0.1:5174",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5174"


def test_valid_lead_is_saved_and_sent_to_mocked_activepieces(
    tmp_path: Path,
) -> None:
    captured_requests: list[httpx.Request] = []

    def handle_request(request: httpx.Request) -> httpx.Response:
        captured_requests.append(request)
        return httpx.Response(200, json={"success": True})

    transport = httpx.MockTransport(handle_request)
    app, database = make_test_app(tmp_path / "valid.sqlite3", transport)

    with TestClient(app) as client:
        response = client.post("/api/leads", json=make_payload())

    assert response.status_code == 202
    body = response.json()
    assert body["activepiecesStatus"] == "accepted"
    assert body["googleSheetsSyncStatus"] == "synced"
    assert body["webhook_synced"] is True
    assert body["leadId"]
    assert len(captured_requests) == 1
    assert captured_requests[0].url == "https://activepieces.test/webhook"
    webhook_payload = json.loads(captured_requests[0].content)
    assert set(webhook_payload) == {
        "leadId",
        "submittedAt",
        "fullName",
        "companyName",
        "email",
        "phone",
        "website",
        "selectedPackage",
        "requirements",
        "status",
        "demo_title",
        "brand_name",
        "solution_summary",
        "estimated_time_saving",
        "steps_summary",
    }
    assert webhook_payload["fullName"] == "Ayşe Yılmaz"
    assert webhook_payload["leadId"] == body["leadId"]
    sent_submitted_at = datetime.fromisoformat(
        webhook_payload["submittedAt"].replace("Z", "+00:00")
    )
    expected_submitted_at = datetime.fromisoformat(
        make_payload()["submittedAt"].replace("Z", "+00:00")
    )
    assert sent_submitted_at == expected_submitted_at
    assert webhook_payload["website"] == ""
    assert webhook_payload["status"] == "Yeni"
    assert webhook_payload["demo_title"] is None
    assert webhook_payload["brand_name"] is None
    assert webhook_payload["solution_summary"] is None
    assert webhook_payload["estimated_time_saving"] is None
    assert webhook_payload["steps_summary"] is None

    saved_lead = database.get_lead(body["leadId"])
    assert saved_lead is not None
    assert saved_lead["email"] == "ayse@example.com"
    assert saved_lead["activepieces_status"] == "accepted"
    assert saved_lead["google_sheets_sync_status"] == "synced"


def test_demo_summary_fields_are_forwarded_to_activepieces(tmp_path: Path) -> None:
    captured_requests: list[httpx.Request] = []
    transport = httpx.MockTransport(
        lambda request: (
            captured_requests.append(request)
            or httpx.Response(200, json={"success": True})
        )
    )
    app, _ = make_test_app(tmp_path / "demo-summary.sqlite3", transport)
    demo_summary = {
        "demo_title": "Randevu Otomasyonu",
        "brand_name": "Örnek Salon",
        "solution_summary": "Randevu taleplerini otomatik yönetin.",
        "estimated_time_saving": "Haftada 8 saat",
        "steps_summary": "1. Talep Alımı → 2. Takvim Onayı",
    }

    with TestClient(app) as client:
        response = client.post(
            "/api/leads",
            json={**make_payload(), **demo_summary},
        )

    assert response.status_code == 202
    webhook_payload = json.loads(captured_requests[0].content)
    for field, value in demo_summary.items():
        assert webhook_payload[field] == value


def test_missing_submitted_at_uses_server_created_timestamp(
    tmp_path: Path,
) -> None:
    captured_requests: list[httpx.Request] = []
    transport = httpx.MockTransport(
        lambda request: (
            captured_requests.append(request)
            or httpx.Response(200, json={"success": True})
        )
    )
    app, _ = make_test_app(tmp_path / "missing-submitted-at.sqlite3", transport)
    payload = make_payload()
    del payload["submittedAt"]

    with TestClient(app) as client:
        response = client.post("/api/leads", json=payload)

    webhook_payload = json.loads(captured_requests[0].content)
    assert webhook_payload["submittedAt"]
    assert webhook_payload["submittedAt"] == response.json()["createdAt"].replace(
        "Z", "+00:00"
    )


def test_invalid_email_is_rejected_without_saving(tmp_path: Path) -> None:
    app, database = make_test_app(tmp_path / "invalid-email.sqlite3")
    payload = make_payload()
    payload["email"] = "not-an-email"

    with TestClient(app) as client:
        response = client.post("/api/leads", json=payload)

    assert response.status_code == 422
    assert database.count_leads() == 0


def test_missing_required_field_is_rejected_without_saving(tmp_path: Path) -> None:
    app, database = make_test_app(tmp_path / "missing-field.sqlite3")
    payload = make_payload()
    del payload["companyName"]

    with TestClient(app) as client:
        response = client.post("/api/leads", json=payload)

    assert response.status_code == 422
    assert database.count_leads() == 0


def test_database_persists_lead_after_reopening(tmp_path: Path) -> None:
    database_path = tmp_path / "persistent.sqlite3"
    app, _ = make_test_app(
        database_path,
        httpx.MockTransport(
            lambda request: httpx.Response(200, json={"success": True})
        ),
    )

    with TestClient(app) as client:
        response = client.post("/api/leads", json=make_payload())

    lead_id = response.json()["leadId"]
    reopened_database = LeadDatabase(database_path)
    reopened_database.initialize()
    saved_lead = reopened_database.get_lead(lead_id)

    assert saved_lead is not None
    assert saved_lead["company_name"] == "Örnek Şirket"


def test_webhook_failure_keeps_lead_and_marks_sync_failed(
    tmp_path: Path, caplog,
) -> None:
    transport = httpx.MockTransport(
        lambda request: httpx.Response(503, json={"error": "unavailable"})
    )
    app, database = make_test_app(tmp_path / "webhook-failure.sqlite3", transport)

    with TestClient(app) as client:
        response = client.post("/api/leads", json=make_payload())

    assert response.status_code == 202
    body = response.json()
    assert body["activepiecesStatus"] == "failed"
    assert body["googleSheetsSyncStatus"] == "failed"
    assert body["webhook_synced"] is False
    assert "HTTP 503" in caplog.text
    assert "unavailable" in caplog.text
    saved_lead = database.get_lead(body["leadId"])
    assert saved_lead is not None
    assert saved_lead["email"] == "ayse@example.com"


@pytest.mark.parametrize(
    ("status_code", "response_body"),
    [
        (200, {"success": False}),
        (201, {"success": True}),
    ],
)
def test_unconfirmed_webhook_response_keeps_lead_and_marks_sync_failed(
    tmp_path: Path,
    status_code: int,
    response_body: dict[str, bool],
) -> None:
    transport = httpx.MockTransport(
        lambda request: httpx.Response(status_code, json=response_body)
    )
    app, database = make_test_app(
        tmp_path / f"unconfirmed-{status_code}-{response_body['success']}.sqlite3",
        transport,
    )

    with TestClient(app) as client:
        response = client.post("/api/leads", json=make_payload())

    body = response.json()
    assert response.status_code == 202
    assert body["activepiecesStatus"] == "failed"
    assert body["googleSheetsSyncStatus"] == "failed"
    assert body["webhook_synced"] is False
    assert database.get_lead(body["leadId"]) is not None


def test_invalid_webhook_json_keeps_lead_and_marks_sync_failed(
    tmp_path: Path,
) -> None:
    transport = httpx.MockTransport(
        lambda request: httpx.Response(200, text="not-json")
    )
    app, database = make_test_app(
        tmp_path / "invalid-webhook-json.sqlite3",
        transport,
    )

    with TestClient(app) as client:
        response = client.post("/api/leads", json=make_payload())

    body = response.json()
    assert response.status_code == 202
    assert body["googleSheetsSyncStatus"] == "failed"
    assert body["webhook_synced"] is False
    assert database.get_lead(body["leadId"]) is not None


def test_webhook_timeout_keeps_lead_and_marks_sync_failed(
    tmp_path: Path,
) -> None:
    def timeout_request(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timed out")

    app, database = make_test_app(
        tmp_path / "webhook-timeout.sqlite3",
        httpx.MockTransport(timeout_request),
    )

    with TestClient(app) as client:
        response = client.post("/api/leads", json=make_payload())

    body = response.json()
    assert response.status_code == 202
    assert body["googleSheetsSyncStatus"] == "failed"
    assert body["webhook_synced"] is False
    assert database.get_lead(body["leadId"]) is not None


def test_missing_webhook_keeps_lead_pending(tmp_path: Path) -> None:
    database_path = tmp_path / "missing-webhook.sqlite3"
    database = LeadDatabase(database_path)
    settings = Settings(
        activepieces_webhook_url="",
        database_path=database_path,
        activepieces_timeout_seconds=1,
        frontend_origins=("http://localhost:5173",),
    )
    app = create_app(settings, database)

    with TestClient(app) as client:
        response = client.post("/api/leads", json=make_payload())

    body = response.json()
    assert response.status_code == 202
    assert body["activepiecesStatus"] == "not_configured"
    assert body["googleSheetsSyncStatus"] == "pending"
    assert body["webhook_synced"] is False
    assert database.get_lead(body["leadId"]) is not None
