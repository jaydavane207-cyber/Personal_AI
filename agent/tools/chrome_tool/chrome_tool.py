"""
Chrome Automation Tool — Playwright-based browser control.

SECURITY NOTES:
- Runs in a dedicated automation profile, separate from personal browsing.
- Limited action set: navigate, read, click, fill_form, extract_data.
- NO arbitrary JS execution — that's how prompt injection becomes arbitrary action.
- All text read from web pages is treated as UNTRUSTED DATA, never instructions.
"""

import json
import re
from typing import Any
from playwright.sync_api import sync_playwright, Browser, Page, BrowserContext

from tools.base_tool import BaseTool
from config import settings


class ChromeTool(BaseTool):
    name = "chrome"
    description = "Automate Chrome browser. Navigate pages, read content, click elements, fill forms, and extract structured data."

    actions = {
        "navigate": "Navigate to a URL. Input: {url: string}",
        "read_page_content": "Read the text content of the current page. Returns cleaned text.",
        "click": "Click an element by CSS selector or text description. Input: {selector: string} or {text: string}",
        "fill_form": "Fill form fields. Input: {fields: [{selector, value}, ...]}",
        "extract_data": "Extract structured data from the page using a schema. Input: {schema: {field: selector, ...}}",
        "get_current_url": "Get the URL of the current page.",
        "go_back": "Navigate back in browser history.",
        "screenshot": "Take a screenshot of the current page. Input: {path: string}",
    }

    # Risk levels — most browser actions are read-only or reversible
    _risk_levels = {
        "navigate": "read-only",
        "read_page_content": "read-only",
        "click": "reversible",
        "fill_form": "reversible",
        "extract_data": "read-only",
        "get_current_url": "read-only",
        "go_back": "read-only",
        "screenshot": "read-only",
    }

    def __init__(self):
        self._playwright = None
        self._browser: Browser | None = None
        self._context: BrowserContext | None = None
        self._page: Page | None = None
        self._initialized = False

    def get_risk_level(self, action: str) -> str:
        self.validate_action(action)
        return self._risk_levels[action]

    def execute(self, action: str, inputs: dict) -> Any:
        self.validate_action(action)
        self._ensure_browser()

        dispatch = {
            "navigate": self._navigate,
            "read_page_content": self._read_page_content,
            "click": self._click,
            "fill_form": self._fill_form,
            "extract_data": self._extract_data,
            "get_current_url": self._get_current_url,
            "go_back": self._go_back,
            "screenshot": self._screenshot,
        }

        return dispatch[action](inputs)

    def _ensure_browser(self):
        """Launch browser lazily on first use."""
        if self._initialized and self._page and not self._page.is_closed():
            return

        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.launch(
            headless=settings.CHROME_HEADLESS,
            slow_mo=settings.CHROME_SLOW_MO,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                f"--user-data-dir={settings.CHROME_USER_DATA_DIR}",
            ],
        )
        self._context = self._browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        self._page = self._context.new_page()
        self._initialized = True

    def _navigate(self, inputs: dict) -> str:
        url = inputs.get("url", "")
        if not url:
            raise ValueError("Missing required input: 'url'")
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        self._page.goto(url, wait_until="domcontentloaded", timeout=30000)
        title = self._page.title()
        return f"Navigated to {url}. Page title: {title}"

    def _read_page_content(self, inputs: dict) -> str:
        """Read page text. Returns cleaned, truncated text."""
        self._page.wait_for_load_state("domcontentloaded")

        # Get text content, stripping scripts and styles
        text = self._page.evaluate("""
            () => {
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: (node) => {
                            const parent = node.parentElement;
                            if (!parent) return NodeFilter.FILTER_REJECT;
                            const tag = parent.tagName.toLowerCase();
                            if (['script', 'style', 'noscript', 'svg'].includes(tag))
                                return NodeFilter.FILTER_REJECT;
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                );
                const texts = [];
                while (walker.nextNode()) {
                    const t = walker.currentNode.textContent.trim();
                    if (t) texts.push(t);
                }
                return texts.join('\\n');
            }
        """)

        # Truncate to prevent massive context dumps
        max_chars = 8000
        if len(text) > max_chars:
            text = text[:max_chars] + f"\n\n[Truncated — {len(text)} total characters]"

        return text

    def _click(self, inputs: dict) -> str:
        selector = inputs.get("selector", "")
        text = inputs.get("text", "")

        if not selector and not text:
            raise ValueError("Provide either 'selector' or 'text' to click")

        if selector:
            self._page.click(selector, timeout=10000)
            return f"Clicked element: {selector}"
        else:
            self._page.get_by_text(text, exact=False).first.click(timeout=10000)
            return f"Clicked element with text: {text}"

    def _fill_form(self, inputs: dict) -> str:
        fields = inputs.get("fields", [])
        if not fields:
            raise ValueError("Missing required input: 'fields' (array of {selector, value})")

        filled = []
        for field in fields:
            selector = field.get("selector", "")
            value = field.get("value", "")
            if not selector:
                continue
            self._page.fill(selector, str(value), timeout=10000)
            filled.append(selector)

        return f"Filled {len(filled)} fields: {', '.join(filled)}"

    def _extract_data(self, inputs: dict) -> str:
        schema = inputs.get("schema", {})
        if not schema:
            raise ValueError("Missing required input: 'schema' ({field_name: css_selector, ...})")

        result = {}
        for field_name, selector in schema.items():
            try:
                elements = self._page.query_selector_all(selector)
                if len(elements) == 1:
                    result[field_name] = elements[0].text_content().strip()
                elif len(elements) > 1:
                    result[field_name] = [el.text_content().strip() for el in elements]
                else:
                    result[field_name] = None
            except Exception:
                result[field_name] = None

        return json.dumps(result, indent=2)

    def _get_current_url(self, inputs: dict) -> str:
        return self._page.url

    def _go_back(self, inputs: dict) -> str:
        self._page.go_back(wait_until="domcontentloaded")
        return f"Navigated back to: {self._page.url}"

    def _screenshot(self, inputs: dict) -> str:
        path = inputs.get("path", str(settings.WORKING_DIR / "screenshot.png"))
        self._page.screenshot(path=path, full_page=False)
        return f"Screenshot saved to: {path}"

    def close(self):
        """Clean up browser resources."""
        try:
            if self._page and not self._page.is_closed():
                self._page.close()
            if self._context:
                self._context.close()
            if self._browser:
                self._browser.close()
            if self._playwright:
                self._playwright.stop()
        except Exception:
            pass
        self._initialized = False

    def __del__(self):
        self.close()
