"""
Base Tool — the interface every tool must implement.

Adding a new app means:
1. Create a new directory in tools/ (e.g., tools/email_tool/)
2. Create a class that extends BaseTool
3. Implement: name, description, actions, get_risk_level(), execute()
4. Register it in the orchestrator's tool registry

That's it — no changes to the orchestrator or security layer needed.
"""

from abc import ABC, abstractmethod
from typing import Any


class BaseTool(ABC):
    """Base class for all tools. Every tool must implement this interface."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique tool identifier (e.g., 'chrome', 'whatsapp')."""
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        """Human-readable description of what this tool does."""
        ...

    @property
    @abstractmethod
    def actions(self) -> dict[str, str]:
        """Map of action_name → description. Only these actions can be called."""
        ...

    @abstractmethod
    def get_risk_level(self, action: str) -> str:
        """
        Return risk level for an action.
        Must be one of: 'read-only', 'reversible', 'irreversible'
        """
        ...

    @abstractmethod
    def execute(self, action: str, inputs: dict) -> Any:
        """
        Execute an action with the given inputs.
        Called ONLY through the Gatekeeper — never directly.
        Credentials are injected here, not passed from the orchestrator.
        """
        ...

    def to_schema(self) -> dict:
        """
        Generate the tool schema for the LLM's function-calling format.
        The orchestrator uses this to tell the LLM what tools are available.
        """
        return {
            "name": self.name,
            "description": self.description,
            "actions": self.actions,
            "risk_levels": {action: self.get_risk_level(action) for action in self.actions},
        }

    def validate_action(self, action: str):
        """Ensure the action is in the allowed set."""
        if action not in self.actions:
            raise ValueError(
                f"Unknown action '{action}' for tool '{self.name}'. "
                f"Allowed actions: {list(self.actions.keys())}"
            )
