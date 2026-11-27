import httpx


class ActivepiecesDeliveryError(Exception):
    """Raised when the Activepieces webhook cannot accept a lead."""

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        response_body: str = "",
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class ActivepiecesService:
    def __init__(
        self,
        webhook_url: str,
        timeout_seconds: float = 8,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.webhook_url = webhook_url
        self.timeout_seconds = timeout_seconds
        self.transport = transport

    @property
    def is_configured(self) -> bool:
        return bool(self.webhook_url)

    def send_lead(self, payload: dict[str, object]) -> None:
        if not self.is_configured:
            raise ActivepiecesDeliveryError("The Activepieces webhook is not configured.")

        try:
            with httpx.Client(
                timeout=self.timeout_seconds,
                transport=self.transport,
            ) as client:
                response = client.post(self.webhook_url, json=payload)
        except httpx.RequestError as error:
            raise ActivepiecesDeliveryError(
                f"The Activepieces webhook request failed: {error.__class__.__name__}."
            ) from error

        if response.status_code != 200:
            raise ActivepiecesDeliveryError(
                "The Activepieces webhook must return HTTP 200.",
                status_code=response.status_code,
                response_body=response.text,
            )

        try:
            response_data = response.json()
        except ValueError as error:
            raise ActivepiecesDeliveryError(
                "The Activepieces webhook returned invalid JSON.",
                status_code=response.status_code,
                response_body=response.text,
            ) from error

        if not isinstance(response_data, dict) or response_data.get("success") is not True:
            raise ActivepiecesDeliveryError(
                "The Activepieces webhook response did not confirm success.",
                status_code=response.status_code,
                response_body=response.text,
            )
