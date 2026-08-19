"""
Audit Logger — Every tool call is logged with full context.

Logs are written as JSON Lines (one JSON object per line) to a file.
Queryable by timestamp, action, risk level, or approval status.
"""

import json
import time
from pathlib import Path
from datetime import datetime, timezone


class AuditLogger:
    def __init__(self, log_file: Path):
        self.log_file = log_file
        self.log_file.parent.mkdir(parents=True, exist_ok=True)

    def log(
        self,
        action: str,
        tool_name: str,
        inputs: dict,
        output: str = "",
        risk_level: str = "read-only",
        approved: bool = True,
        approval_method: str = "auto",
        error: str = "",
        session_id: str = "",
        duration_ms: float = 0,
    ):
        """Append one audit entry."""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "epoch": time.time(),
            "session_id": session_id,
            "tool": tool_name,
            "action": action,
            "risk_level": risk_level,
            "inputs": self._sanitize(inputs),
            "output_preview": output[:500] if output else "",
            "approved": approved,
            "approval_method": approval_method,
            "error": error,
            "duration_ms": round(duration_ms, 1),
        }
        with open(self.log_file, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def query(
        self,
        since: datetime = None,
        tool: str = None,
        risk_level: str = None,
        approved: bool = None,
        limit: int = 100,
    ) -> list[dict]:
        """Query audit log with optional filters."""
        if not self.log_file.exists():
            return []

        results = []
        with open(self.log_file) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                if since and entry.get("epoch", 0) < since.timestamp():
                    continue
                if tool and entry.get("tool") != tool:
                    continue
                if risk_level and entry.get("risk_level") != risk_level:
                    continue
                if approved is not None and entry.get("approved") != approved:
                    continue

                results.append(entry)

        return results[-limit:]

    def get_summary(self, hours: int = 24) -> dict:
        """Get a summary of recent activity."""
        since = datetime.now(timezone.utc).timestamp() - (hours * 3600)
        entries = self.query(since=datetime.fromtimestamp(since, timezone.utc))

        return {
            "total_actions": len(entries),
            "by_tool": self._count_by(entries, "tool"),
            "by_risk": self._count_by(entries, "risk_level"),
            "approved": sum(1 for e in entries if e.get("approved")),
            "denied": sum(1 for e in entries if not e.get("approved")),
            "errors": sum(1 for e in entries if e.get("error")),
            "hours": hours,
        }

    def _sanitize(self, inputs: dict) -> dict:
        """Remove any values that look like credentials."""
        sanitized = {}
        sensitive_keys = {"password", "token", "secret", "key", "auth", "cookie", "credential"}
        for k, v in inputs.items():
            if any(s in k.lower() for s in sensitive_keys):
                sanitized[k] = "[REDACTED]"
            elif isinstance(v, str) and len(v) > 200:
                sanitized[k] = v[:200] + "..."
            else:
                sanitized[k] = v
        return sanitized

    def _count_by(self, entries: list, field: str) -> dict:
        counts = {}
        for e in entries:
            val = e.get(field, "unknown")
            counts[val] = counts.get(val, 0) + 1
        return counts
