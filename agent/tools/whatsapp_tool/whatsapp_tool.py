"""
WhatsApp Tool — STUB

⚠️ NOT YET IMPLEMENTED — requires user confirmation of integration path.

Options:
1. WhatsApp Business Cloud API (Meta) — official, stable, requires verification
2. WhatsApp Web automation — fragile, against ToS, risks account ban

This stub exists so the tool registry has a placeholder.
The user must confirm which path before this is built.
"""

from typing import Any
from tools.base_tool import BaseTool


class WhatsAppTool(BaseTool):
    name = "whatsapp"
    description = "Send and read WhatsApp messages. (NOT YET IMPLEMENTED — requires user confirmation of integration path.)"

    actions = {
        "send_message": "Send a WhatsApp message. Input: {to: string, message: string} [IRREVERSIBLE]",
        "read_messages": "Read recent messages from a chat. Input: {chat_id: string, limit: int}",
        "list_chats": "List recent WhatsApp chats.",
    }

    _risk_levels = {
        "send_message": "irreversible",
        "read_messages": "read-only",
        "list_chats": "read-only",
    }

    def __init__(self):
        self._configured = False

    def get_risk_level(self, action: str) -> str:
        self.validate_action(action)
        return self._risk_levels[action]

    def execute(self, action: str, inputs: dict) -> Any:
        self.validate_action(action)
        raise NotImplementedError(
            "WhatsApp tool is not yet implemented.\n"
            "Two options exist:\n"
            "  1. WhatsApp Business Cloud API (Meta) — official, stable, requires Meta Business verification\n"
            "  2. WhatsApp Web automation (whatsapp-web.js or Playwright) — faster to set up, but:\n"
            "     - Fragile (breaks when WhatsApp updates their web client)\n"
            "     - Against WhatsApp Terms of Service\n"
            "     - Risks account suspension/ban\n\n"
            "Please confirm which integration path you want before this tool is built.\n"
            "Set WHATSAPP_INTEGRATION_PATH=business_api or whatsapp_web in .env to proceed."
        )
