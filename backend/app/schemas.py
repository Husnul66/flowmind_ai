from datetime import datetime
from typing import Annotated, Literal

from pydantic import (
    AnyHttpUrl,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


class LeadCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
        str_strip_whitespace=True,
    )

    full_name: str = Field(alias="fullName", min_length=1, max_length=200)
    company_name: str = Field(alias="companyName", min_length=1, max_length=200)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=50)
    website: AnyHttpUrl | None = None
    selected_package: str = Field(alias="selectedPackage", min_length=1, max_length=80)
    requirements: str = Field(min_length=1, max_length=10000)
    submitted_at: datetime | None = Field(default=None, alias="submittedAt")
    demo_title: str | None = None
    brand_name: str | None = None
    solution_summary: str | None = None
    estimated_time_saving: str | None = None
    steps_summary: str | None = None

    @field_validator("website", mode="before")
    @classmethod
    def empty_website_is_optional(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value


class LeadSubmissionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    lead_id: str = Field(alias="leadId")
    created_at: datetime = Field(alias="createdAt")
    webhook_synced: bool
    activepieces_status: Literal["not_configured", "accepted", "failed"] = Field(
        alias="activepiecesStatus"
    )
    google_sheets_sync_status: Literal["pending", "failed", "synced"] = Field(
        alias="googleSheetsSyncStatus"
    )


class DemoCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: str = Field(min_length=1, max_length=1000)

    @field_validator("prompt", mode="before")
    @classmethod
    def strip_prompt_with_raw_length_limit(cls, value: object) -> object:
        if isinstance(value, str):
            if len(value) > 1000:
                raise ValueError("Prompt must not exceed 1000 characters.")
            return value.strip()
        return value


class DemoStep(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=300)
    tool: str = Field(min_length=1, max_length=120)


class MiniSiteChatMessage(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    sender: Literal["customer", "bot", "system"]
    text: str = Field(min_length=1, max_length=180)


class MiniSiteKPICard(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    label: str = Field(min_length=1, max_length=60)
    value: str = Field(min_length=1, max_length=40)


class MiniSitePreview(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    brand_name: str = Field(min_length=1, max_length=80)
    domain_slug: str = Field(
        min_length=1,
        max_length=60,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    tagline: str = Field(min_length=1, max_length=140)
    accent_color: Literal["indigo", "emerald", "rose", "amber"]
    selectable_options: list[Annotated[str, Field(min_length=1, max_length=80)]] = (
        Field(min_length=3, max_length=3)
    )
    chat_preview: list[MiniSiteChatMessage] = Field(min_length=3, max_length=3)
    kpi_cards: list[MiniSiteKPICard] = Field(min_length=2, max_length=2)

    @field_validator("chat_preview")
    @classmethod
    def require_customer_bot_system_sequence(
        cls,
        value: list[MiniSiteChatMessage],
    ) -> list[MiniSiteChatMessage]:
        if [message.sender for message in value] != ["customer", "bot", "system"]:
            raise ValueError("Chat preview must contain customer, bot, then system.")
        return value


class DemoResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    mini_site: MiniSitePreview
    title: str = Field(min_length=1, max_length=120)
    business_problem: str = Field(min_length=1, max_length=400)
    solution_summary: str = Field(min_length=1, max_length=800)
    steps: list[DemoStep] = Field(min_length=1, max_length=5)
    benefits: list[str] = Field(min_length=1, max_length=3)
    estimated_time_saving: str = Field(min_length=1, max_length=200)
    implementation_note: str = Field(min_length=1, max_length=600)

    @field_validator("benefits")
    @classmethod
    def benefits_must_not_be_blank(cls, value: list[str]) -> list[str]:
        if any(not benefit.strip() for benefit in value):
            raise ValueError("Benefits must not contain blank items.")
        return [benefit.strip() for benefit in value]
