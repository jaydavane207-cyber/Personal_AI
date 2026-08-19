"""
Personal AI Agent — Configuration

All secrets loaded from environment variables or .env file.
NEVER hardcode credentials here.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
_env_path = Path(__file__).parent.parent / ".env"
load_dotenv(_env_path)

# ── LLM Configuration ──────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-4-20250514")
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "4096"))

# ── Chrome / Playwright ────────────────────────────────────
CHROME_USER_DATA_DIR = os.getenv("CHROME_USER_DATA_DIR", "/tmp/chrome-agent-profile")
CHROME_HEADLESS = os.getenv("CHROME_HEADLESS", "true").lower() == "true"
CHROME_SLOW_MO = int(os.getenv("CHROME_SLOW_MO", "100"))

# ── WhatsApp ───────────────────────────────────────────────
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_API_VERSION = os.getenv("WHATSAPP_API_VERSION", "v18.0")

# ── Security ───────────────────────────────────────────────
# Human-in-the-loop: which risk levels require approval
# Options: read-only, reversible, irreversible
REQUIRE_APPROVAL_FOR = os.getenv("REQUIRE_APPROVAL_FOR", "irreversible").split(",")

# Max actions per session before requiring re-authorization
MAX_ACTIONS_PER_SESSION = int(os.getenv("MAX_ACTIONS_PER_SESSION", "50"))

# Kill switch — set to "true" to immediately halt all agent operations
KILL_SWITCH = os.getenv("AGENT_KILL_SWITCH", "false").lower() == "true"

# ── Logging ────────────────────────────────────────────────
LOG_DIR = Path(os.getenv("LOG_DIR", str(Path(__file__).parent.parent / "logs")))
LOG_FILE = LOG_DIR / "agent_audit.jsonl"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# ── Sandbox ────────────────────────────────────────────────
WORKING_DIR = Path(os.getenv("WORKING_DIR", "/tmp/agent-workspace"))
ALLOWED_FILE_PATHS = [str(WORKING_DIR)]  # Agent can only access this directory

# ── Runtime Validation ─────────────────────────────────────

def validate_config():
    """Check that required config is present. Call at startup."""
    errors = []
    if not ANTHROPIC_API_KEY:
        errors.append("ANTHROPIC_API_KEY is not set. Add it to .env or environment.")
    
    if errors:
        raise ValueError("Configuration errors:\n" + "\n".join(f"  - {e}" for e in errors))
    
    # Ensure directories exist
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    WORKING_DIR.mkdir(parents=True, exist_ok=True)
    Path(CHROME_USER_DATA_DIR).mkdir(parents=True, exist_ok=True)
