"""Centralized API errors. Safe messages to clients; details stay server-side."""

from __future__ import annotations


class AppError(Exception):
    code: str = "INTERNAL_ERROR"
    status_code: int = 500
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None, *, code: str | None = None) -> None:
        self.message = message or self.message
        if code:
            self.code = code
        super().__init__(self.message)

    def to_body(self) -> dict:
        return {"success": False, "error": {"code": self.code, "message": self.message}}


class AuthenticationError(AppError):
    code = "UNAUTHENTICATED"
    status_code = 401
    message = "Authentication required."


class AuthorizationError(AppError):
    code = "FORBIDDEN"
    status_code = 403
    message = "You do not have permission to perform this action."


class ValidationError(AppError):
    code = "VALIDATION_ERROR"
    status_code = 422
    message = "Request validation failed."


class NotFoundError(AppError):
    code = "NOT_FOUND"
    status_code = 404
    message = "Resource not found."


class ConflictError(AppError):
    code = "CONFLICT"
    status_code = 409
    message = "Resource conflict."


class ServiceUnavailableError(AppError):
    code = "SERVICE_UNAVAILABLE"
    status_code = 503
    message = "A required service is not configured or unavailable."


class AgentExecutionError(AppError):
    code = "AGENT_EXECUTION_ERROR"
    status_code = 502
    message = "Agent execution failed."


class WorkflowExecutionError(AppError):
    code = "WORKFLOW_EXECUTION_ERROR"
    status_code = 502
    message = "Workflow execution failed."


class RAGError(AppError):
    code = "RAG_ERROR"
    status_code = 502
    message = "Knowledge retrieval failed."


class ExternalServiceError(AppError):
    code = "EXTERNAL_SERVICE_ERROR"
    status_code = 502
    message = "External service request failed."
