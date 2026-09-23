"""Automation request/response schemas."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AutomationTriggerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payload: dict[str, Any] = Field(default_factory=dict)
    idempotency_key: str | None = Field(default=None, max_length=128)


class LeadFlowRequest(AutomationTriggerRequest):
    payload: dict[str, Any] = Field(
        default_factory=dict,
        description="Lead fields such as name, email, company, source.",
    )


class MailPilotRequest(AutomationTriggerRequest):
    pass


class InvoiceFlowRequest(AutomationTriggerRequest):
    pass


class SupportSyncRequest(AutomationTriggerRequest):
    pass


class ContentFlowRequest(AutomationTriggerRequest):
    pass
