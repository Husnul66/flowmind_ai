import logging
from datetime import datetime

from app.database import LeadDatabase
from app.schemas import LeadCreate, LeadSubmissionResponse
from app.services.activepieces_service import (
    ActivepiecesDeliveryError,
    ActivepiecesService,
)

logger = logging.getLogger(__name__)


class LeadService:
    def __init__(
        self,
        database: LeadDatabase,
        activepieces: ActivepiecesService,
    ) -> None:
        self.database = database
        self.activepieces = activepieces

    def submit(self, lead: LeadCreate) -> LeadSubmissionResponse:
        saved_lead = self.database.insert_lead(lead)
        lead_id = str(saved_lead["id"])
        created_at = str(saved_lead["created_at"])
        activepieces_status = "not_configured"
        google_sheets_sync_status = "pending"

        if self.activepieces.is_configured:
            payload = lead.model_dump(mode="json", by_alias=True)
            payload["leadId"] = lead_id
            payload["submittedAt"] = payload["submittedAt"] or created_at
            payload["website"] = payload["website"] or ""
            payload["status"] = "Yeni"

            try:
                self.activepieces.send_lead(payload)
            except ActivepiecesDeliveryError as error:
                activepieces_status = "failed"
                google_sheets_sync_status = "failed"
                if error.status_code is not None:
                    response_body = error.response_body[:1000]
                    logger.error(
                        "Activepieces delivery failed for saved lead %s: "
                        "HTTP %s; response body: %s",
                        lead_id,
                        error.status_code,
                        response_body or "<empty>",
                    )
                else:
                    logger.error(
                        "Activepieces delivery failed for saved lead %s: %s",
                        lead_id,
                        error,
                    )
            else:
                activepieces_status = "accepted"
                google_sheets_sync_status = "synced"

        self.database.update_delivery_status(
            lead_id,
            activepieces_status,
            google_sheets_sync_status,
        )

        return LeadSubmissionResponse(
            lead_id=lead_id,
            created_at=datetime.fromisoformat(created_at),
            activepieces_status=activepieces_status,
            google_sheets_sync_status=google_sheets_sync_status,
            webhook_synced=google_sheets_sync_status == "synced",
        )
