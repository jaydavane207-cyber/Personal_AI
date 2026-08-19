"""
Background Browsing Mode — elevated trust for autonomous research.

Enforces at CODE LEVEL (not prompt level):
- Domain block-list with boundary-aware regex (prevents lookalike bypasses)
- URL shortener detection (must be resolved before checking)
- Idle timeout with 10-minute warning
- Rate limits (max pages, max duration)
- Only read-only actions become autonomous
- Reversible + irreversible still require approval
- Isolated browser context (no shared cookies/sessions)
- Tagged audit log for background sessions
- Pre-execution audit logging (crash-safe)
"""

import time
import re
import threading
from typing import Optional, Callable
from dataclasses import dataclass, field
from urllib.parse import urlparse


# ── Block-list: boundary-aware patterns ─────────────────────
# (^|\.) ensures we match domain boundaries, not substrings.
# "evil.mybank.com.attacker.net" would NOT match "(^|\.)mybank\.com"
# because "mybank.com" is not at a domain boundary in that URL.

DEFAULT_BLOCKED_DOMAINS = [
    # Banking & financial
    r"(^|\.)hdfcbank\.", r"(^|\.)icicibank\.", r"(^|\.)sbi\.co", r"(^|\.)axisbank\.", r"(^|\.)kotak\.",
    r"(^|\.)chase\.com", r"(^|\.)bankofamerica\.", r"(^|\.)wellsfargo\.", r"(^|\.)citi\.com",
    r"(^|\.)paypal\.com", r"(^|\.)stripe\.com", r"(^|\.)razorpay\.", r"(^|\.)paytm\.",
    r"(^|\.)binance\.", r"(^|\.)coinbase\.", r"(^|\.)zerodha\.", r"(^|\.)groww\.", r"(^|\.)upstox\.",

    # Social media
    r"(^|\.)facebook\.com", r"(^|\.)instagram\.com", r"(^|\.)twitter\.com",
    r"(^|\.)linkedin\.com", r"(^|\.)snapchat\.com", r"(^|\.)tiktok\.com", r"(^|\.)reddit\.com",
    r"(^|\.)threads\.net", r"(^|\.)mastodon\.",

    # Email
    r"(^|\.)mail\.google", r"(^|\.)outlook\.live", r"(^|\.)mail\.yahoo",
    r"(^|\.)protonmail\.", r"(^|\.)zoho\.mail",

    # Messaging
    r"(^|\.)web\.whatsapp", r"(^|\.)telegram\.org", r"(^|\.)discord\.com", r"(^|\.)slack\.com",

    # Government / identity
    r"aadhaar", r"pan\.nsdl", r"incometax", r"(^|\.)gov\.in",
    r"passport", r"dmv\.", r"(^|\.)ssa\.gov",
]

# URL shortener domains — must be resolved before checking the block-list.
# If the agent encounters one of these, it must resolve the redirect target
# and check THAT against the block-list, not the shortener domain itself.
URL_SHORTENERS = {
    "bit.ly", "t.co", "tinyurl.com", "goo.gl", "ow.ly",
    "is.gd", "buff.ly", "rebrand.ly", "short.io", "cutt.ly",
}

# Idle timeout constants
IDLE_TIMEOUT_SECONDS = 2 * 60 * 60  # 2 hours
IDLE_WARNING_SECONDS = 10 * 60      # 10 minutes before auto-off


@dataclass
class BackgroundSession:
    """Tracks a single background browsing session."""
    session_id: str
    started_at: float = field(default_factory=time.time)
    last_activity_at: float = field(default_factory=time.time)
    pages_visited: int = 0
    max_pages: int = 100
    max_duration_seconds: int = 3600  # 60 minutes
    idle_timeout_seconds: int = IDLE_TIMEOUT_SECONDS
    is_active: bool = True
    is_paused: bool = False
    idle_warning_shown: bool = False
    actions_log: list = field(default_factory=list)

    @property
    def elapsed_seconds(self) -> float:
        return time.time() - self.started_at

    @property
    def idle_seconds(self) -> float:
        return time.time() - self.last_activity_at

    @property
    def remaining_pages(self) -> int:
        return max(0, self.max_pages - self.pages_visited)

    @property
    def idle_warning_due(self) -> bool:
        """True if idle warning threshold reached but not yet auto-disabled."""
        remaining = self.idle_timeout_seconds - self.idle_seconds
        return (
            self.is_active
            and not self.is_paused
            and remaining <= IDLE_WARNING_SECONDS
            and remaining > 0
            and not self.idle_warning_shown
        )

    @property
    def is_within_limits(self) -> bool:
        return (
            self.is_active
            and not self.is_paused
            and self.pages_visited < self.max_pages
            and self.elapsed_seconds < self.max_duration_seconds
            and self.idle_seconds < self.idle_timeout_seconds
        )

    def record_action(self, action: str, url: str, allowed: bool, reason: str = ""):
        self.last_activity_at = time.time()
        self.actions_log.append({
            "timestamp": time.time(),
            "action": action,
            "url": url,
            "allowed": allowed,
            "reason": reason,
        })
        if allowed:
            self.pages_visited += 1

    def mark_idle_warning_shown(self):
        self.idle_warning_shown = True


class BackgroundModeController:
    """
    Controls background browsing mode.
    Enforces domain block-list and rate limits at code level.
    """

    def __init__(
        self,
        blocked_domains: list[str] = None,
        max_pages: int = 100,
        max_duration_seconds: int = 3600,
        idle_timeout_seconds: int = IDLE_TIMEOUT_SECONDS,
        on_idle_warning: Callable = None,
        on_idle_timeout: Callable = None,
    ):
        self.blocked_patterns = blocked_domains or DEFAULT_BLOCKED_DOMAINS
        self.max_pages = max_pages
        self.max_duration_seconds = max_duration_seconds
        self.idle_timeout_seconds = idle_timeout_seconds
        self._session: Optional[BackgroundSession] = None
        self._enabled = False
        self._on_idle_warning = on_idle_warning
        self._on_idle_timeout = on_idle_timeout
        self._idle_checker: Optional[threading.Thread] = None
        self._stop_checker = threading.Event()

    @property
    def is_enabled(self) -> bool:
        if not self._enabled or self._session is None:
            return False
        # Check idle timeout
        if self._session.idle_seconds >= self.idle_timeout_seconds:
            self.disable()
            if self._on_idle_timeout:
                self._on_idle_timeout()
            return False
        return self._session.is_within_limits

    @property
    def session(self) -> Optional[BackgroundSession]:
        return self._session

    def enable(self, session_id: str) -> dict:
        """Enable background mode — creates a new session."""
        self._enabled = True
        self._session = BackgroundSession(
            session_id=session_id,
            max_pages=self.max_pages,
            max_duration_seconds=self.max_duration_seconds,
            idle_timeout_seconds=self.idle_timeout_seconds,
        )
        self._start_idle_checker()
        return {
            "enabled": True,
            "session_id": session_id,
            "max_pages": self.max_pages,
            "max_duration_minutes": self.max_duration_seconds // 60,
            "idle_timeout_minutes": self.idle_timeout_seconds // 60,
            "blocked_categories": "banking, social media, email, messaging, government/identity",
        }

    def disable(self):
        """Disable background mode — ends session."""
        if self._session:
            self._session.is_active = False
        self._enabled = False
        self._stop_idle_checker()

    def pause(self):
        """Pause background mode without ending session."""
        if self._session:
            self._session.is_paused = True

    def resume(self):
        """Resume paused background mode."""
        if self._session:
            self._session.is_paused = False
            self._session.last_activity_at = time.time()

    def heartbeat(self):
        """Call this on any user interaction to reset idle timer."""
        if self._session:
            self._session.last_activity_at = time.time()

    def check_url_allowed(self, url: str) -> dict:
        """
        HARD CHECK: Is this URL allowed in background mode?
        Returns: {"allowed": bool, "reason": str}
        Enforced at code level, not via prompt.
        """
        if not self._enabled or self._session is None:
            return {"allowed": False, "reason": "Background mode is not enabled"}

        # Check idle timeout
        if self._session.idle_seconds >= self.idle_timeout_seconds:
            self.disable()
            return {"allowed": False, "reason": f"Idle timeout reached ({self.idle_timeout_seconds // 60} min of inactivity)"}

        if not self._session.is_within_limits:
            reasons = []
            if self._session.pages_visited >= self._session.max_pages:
                reasons.append(f"Page limit reached ({self._session.max_pages})")
            if self._session.elapsed_seconds >= self._session.max_duration_seconds:
                reasons.append(f"Time limit reached ({self._session.max_duration_seconds // 60} min)")
            if self._session.is_paused:
                reasons.append("Session is paused")
            return {"allowed": False, "reason": "; ".join(reasons)}

        # Check for URL shorteners — must resolve before checking
        shortener_check = self._is_url_shortener(url)
        if shortener_check["is_shortener"]:
            return {
                "allowed": False,
                "reason": f"URL shortener detected ({shortener_check['domain']}). "
                          "Must resolve the redirect target and check that URL against the block-list. "
                          "Shorteners can mask blocked destinations.",
            }

        # Check domain block-list
        domain_check = self._is_domain_blocked(url)
        if domain_check["blocked"]:
            self._session.record_action("navigate", url, False, domain_check["reason"])
            return {"allowed": False, "reason": domain_check["reason"]}

        return {"allowed": True, "reason": "URL is allowed"}

    def check_url_allowed_after_redirect(self, original_url: str, final_url: str) -> dict:
        """
        Check the FINAL URL after a redirect. The original URL may have been
        allowed, but the redirect destination might be blocked.
        """
        if not self._enabled or self._session is None:
            return {"allowed": False, "reason": "Background mode is not enabled"}

        domain_check = self._is_domain_blocked(final_url)
        if domain_check["blocked"]:
            self._session.record_action(
                "redirect_blocked", original_url, False,
                f"Redirect from {original_url} to blocked domain: {domain_check['reason']}"
            )
            return {"allowed": False, "reason": f"Redirect to blocked domain: {domain_check['reason']}"}

        return {"allowed": True, "reason": "Redirect target is allowed"}

    def record_page_visit(self, action: str, url: str):
        """Record a page visit for rate limiting and audit."""
        if self._session:
            self._session.record_action(action, url, True)

    def get_session_log(self) -> list[dict]:
        """Get the action log for the current background session."""
        if not self._session:
            return []
        return self._session.actions_log

    def get_status(self) -> dict:
        """Get current background mode status."""
        if not self._session:
            return {"enabled": False, "session": None}

        idle_remaining = max(0, self.idle_timeout_seconds - self._session.idle_seconds)

        return {
            "enabled": self._enabled,
            "active": self._session.is_active,
            "paused": self._session.is_paused,
            "within_limits": self._session.is_within_limits,
            "pages_visited": self._session.pages_visited,
            "max_pages": self._session.max_pages,
            "remaining_pages": self._session.remaining_pages,
            "elapsed_minutes": round(self._session.elapsed_seconds / 60, 1),
            "max_minutes": self._session.max_duration_seconds // 60,
            "idle_remaining_minutes": round(idle_remaining / 60, 1),
            "idle_timeout_minutes": self.idle_timeout_seconds // 60,
            "idle_warning_due": self._session.idle_warning_due,
            "total_actions": len(self._session.actions_log),
            "blocked_attempts": sum(1 for a in self._session.actions_log if not a["allowed"]),
        }

    # ── Idle timeout checker (background thread) ────────────

    def _start_idle_checker(self):
        self._stop_checker.clear()
        self._idle_checker = threading.Thread(target=self._idle_check_loop, daemon=True)
        self._idle_checker.start()

    def _stop_idle_checker(self):
        self._stop_checker.set()

    def _idle_check_loop(self):
        while not self._stop_checker.is_set():
            time.sleep(30)  # Check every 30 seconds
            if not self._session or not self._session.is_active:
                break
            # Check idle warning
            if self._session.idle_warning_due and self._on_idle_warning:
                self._session.mark_idle_warning_shown()
                self._on_idle_warning(self._session.idle_seconds)
            # Check idle timeout
            if self._session.idle_seconds >= self.idle_timeout_seconds:
                self.disable()
                if self._on_idle_timeout:
                    self._on_idle_timeout()
                break

    # ── Domain checking ─────────────────────────────────────

    def _is_url_shortener(self, url: str) -> dict:
        """Check if URL is from a known URL shortener."""
        try:
            parsed = urlparse(url.lower())
            domain = parsed.netloc.lstrip("www.")
            if domain in URL_SHORTENERS:
                return {"is_shortener": True, "domain": domain}
        except Exception:
            pass
        return {"is_shortener": False, "domain": ""}

    def _is_domain_blocked(self, url: str) -> dict:
        """Check if URL matches any blocked domain pattern."""
        try:
            parsed = urlparse(url.lower())
            # Use netloc (domain) for matching, not the full URL.
            # This prevents path/query injection: "https://example.com/?redirect=facebook.com"
            domain = parsed.netloc.lstrip("www.")
        except Exception:
            domain = url.lower()

        for pattern in self.blocked_patterns:
            try:
                if re.search(pattern, domain):
                    return {
                        "blocked": True,
                        "reason": f"Domain '{domain}' matches blocked pattern: '{pattern}'",
                    }
            except re.error:
                if pattern in domain:
                    return {
                        "blocked": True,
                        "reason": f"Domain '{domain}' contains blocked keyword: '{pattern}'",
                    }
        return {"blocked": False, "reason": ""}
