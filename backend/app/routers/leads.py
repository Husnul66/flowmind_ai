from fastapi import APIRouter, Request, Response

from app.schemas import LeadCreate, LeadSubmissionResponse

router = APIRouter(prefix="/api", tags=["leads"])


@router.post(
    "/leads",
    response_model=LeadSubmissionResponse,
    status_code=202,
    summary="Save a contact lead",
    description=(
        "Saves the lead to SQLite before delivering it to Activepieces. "
        "A webhook acknowledgement does not confirm Google Sheets completion."
    ),
)
def create_lead(
    lead: LeadCreate,
    request: Request,
    response: Response,
) -> LeadSubmissionResponse:
    response.status_code = 202
    return request.app.state.lead_service.submit(lead)
