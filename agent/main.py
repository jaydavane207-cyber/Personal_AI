#!/usr/bin/env python3
"""
Personal AI Agent — Main Entry Point

Usage:
    python main.py                  # Interactive CLI mode
    python main.py --task "..."     # Single task mode
    python main.py --status         # Show agent status
    python main.py --audit          # Show recent audit log
    python main.py --kill           # Activate kill switch
"""

import sys
import argparse
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from config import settings
from config.settings import validate_config
from security.audit_logger import AuditLogger
from security.approval import ApprovalFlow
from security.gatekeeper import Gatekeeper
from orchestrator.orchestrator import Orchestrator
from tools.chrome_tool import ChromeTool
from tools.whatsapp_tool import WhatsAppTool


def build_agent() -> Orchestrator:
    """Initialize and wire up all components."""
    validate_config()

    # Security layer
    audit = AuditLogger(settings.LOG_FILE)
    approval = ApprovalFlow(require_for=settings.REQUIRE_APPROVAL_FOR)
    gatekeeper = Gatekeeper(audit, approval)

    # Orchestrator
    orchestrator = Orchestrator(gatekeeper)

    # Register tools
    chrome = ChromeTool()
    orchestrator.register_tool(chrome)

    whatsapp = WhatsAppTool()
    orchestrator.register_tool(whatsapp)

    return orchestrator


def interactive_mode(orchestrator: Orchestrator):
    """Interactive CLI loop."""
    print("\n🤖 Personal AI Agent — Interactive Mode")
    print("=" * 50)
    print(f"Session: {orchestrator.session_id}")
    print(f"Tools: {', '.join(orchestrator.tools.keys())}")
    print(f"Approval required for: {', '.join(settings.REQUIRE_APPROVAL_FOR)}")
    print("Type 'quit' to exit, 'status' for agent status, 'audit' for recent logs")
    print("=" * 50)

    while True:
        try:
            user_input = input("\n🧑 You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye.")
            break

        if not user_input:
            continue

        if user_input.lower() in ("quit", "exit", "q"):
            print("Goodbye.")
            break

        if user_input.lower() == "status":
            import json
            print(json.dumps(orchestrator.get_status(), indent=2))
            continue

        if user_input.lower() == "audit":
            audit = orchestrator.gatekeeper.audit
            entries = audit.query(limit=10)
            if not entries:
                print("No audit entries yet.")
            else:
                for e in entries:
                    icon = "✅" if e["approved"] else "❌"
                    print(f"  {icon} [{e['timestamp'][:19]}] {e['tool']}.{e['action']} ({e['risk_level']})")
            continue

        if user_input.lower() == "kill":
            orchestrator.gatekeeper.activate_kill_switch()
            print("⚠️  Kill switch activated. All operations halted.")
            continue

        # Run through orchestrator
        try:
            response = orchestrator.run(user_input)
            print(f"\n🤖 Agent: {response}")
        except Exception as e:
            print(f"\n❌ Error: {e}")


def main():
    parser = argparse.ArgumentParser(description="Personal AI Agent")
    parser.add_argument("--task", type=str, help="Run a single task and exit")
    parser.add_argument("--status", action="store_true", help="Show agent status")
    parser.add_argument("--audit", action="store_true", help="Show recent audit log")
    parser.add_argument("--kill", action="store_true", help="Activate kill switch")
    args = parser.parse_args()

    orchestrator = build_agent()

    if args.status:
        import json
        print(json.dumps(orchestrator.get_status(), indent=2))
        return

    if args.audit:
        audit = orchestrator.gatekeeper.audit
        summary = audit.get_summary(hours=24)
        import json
        print(json.dumps(summary, indent=2))
        return

    if args.kill:
        orchestrator.gatekeeper.activate_kill_switch()
        print("⚠️  Kill switch activated.")
        return

    if args.task:
        response = orchestrator.run(args.task)
        print(response)
        return

    interactive_mode(orchestrator)


if __name__ == "__main__":
    main()
