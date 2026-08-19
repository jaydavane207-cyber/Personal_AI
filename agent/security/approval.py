"""
Human-in-the-loop Approval Flow (v1: CLI terminal prompt)

Risk levels:
- read-only: Runs autonomously (reading pages, listing items)
- reversible: Runs autonomously, logged (filling a form without submitting)
- irreversible: MUST pause for human approval (sending messages, submitting forms, deleting)
"""

import sys
from typing import Optional


class ApprovalFlow:
    def __init__(self, require_for: list[str] = None):
        self.require_for = require_for or ["irreversible"]
        self._history: list[dict] = []

    def request_approval(
        self,
        action: str,
        tool_name: str,
        inputs: dict,
        risk_level: str,
        context: str = "",
    ) -> dict:
        """
        Request human approval for an action.
        Returns: {"approved": bool, "method": str, "reason": str}
        """
        # Auto-approve if risk level doesn't require approval
        if risk_level not in self.require_for:
            result = {"approved": True, "method": "auto", "reason": f"Risk level '{risk_level}' does not require approval"}
            self._history.append({**result, "action": action, "tool": tool_name})
            return result

        # Show approval request
        print("\n" + "=" * 60)
        print("⚠️  HUMAN APPROVAL REQUIRED")
        print("=" * 60)
        print(f"  Tool:    {tool_name}")
        print(f"  Action:  {action}")
        print(f"  Risk:    {risk_level}")
        print(f"  Inputs:  {self._format_inputs(inputs)}")
        if context:
            print(f"  Context: {context}")
        print("=" * 60)

        while True:
            try:
                response = input("  Approve? [y]es / [n]o / [d]etails: ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                response = "n"

            if response in ("y", "yes"):
                result = {"approved": True, "method": "human_cli", "reason": "Approved by user"}
                break
            elif response in ("n", "no"):
                reason = input("  Reason for denial (optional): ").strip() or "Denied by user"
                result = {"approved": False, "method": "human_cli", "reason": reason}
                break
            elif response in ("d", "details"):
                self._show_details(action, tool_name, inputs, context)
            else:
                print("  Please enter y, n, or d.")

        self._history.append({**result, "action": action, "tool": tool_name})
        return result

    def get_history(self) -> list[dict]:
        return self._history.copy()

    def _format_inputs(self, inputs: dict) -> str:
        parts = []
        for k, v in inputs.items():
            val = str(v)
            if len(val) > 80:
                val = val[:80] + "..."
            parts.append(f"{k}={val}")
        return ", ".join(parts) if parts else "(none)"

    def _show_details(self, action, tool_name, inputs, context):
        print("\n  ── Full Details ─────────────────────────────")
        print(f"  Tool:   {tool_name}")
        print(f"  Action: {action}")
        for k, v in inputs.items():
            print(f"  {k}: {v}")
        if context:
            print(f"  Context: {context}")
        print("  ────────────────────────────────────────────\n")
