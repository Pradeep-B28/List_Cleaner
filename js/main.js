// Main entry point for List Cleaner
import { CONFIG } from "../config.js";
import { cleanList } from "./engine/cleaner.js";
import { getTheme, setTheme } from "./store.js";
import { initLoader, triggerScan, prefersReducedMotion } from "./motion.js";
import { initInputUI } from "./input-ui.js";
import { renderResult, renderEmpty } from "./result-ui.js";

// State: raw text and cleaned results held only in memory (Rule 4)
let currentText = "";
let currentResult = null;
let currentFormat = CONFIG.defaultFormat || "e164";

function doClean(text) {
  currentText = text || "";
  if (!currentText.trim()) {
    currentResult = { empty: true };
    renderEmpty();
    return;
  }

  // 1. Run engine immediately
  currentResult = cleanList(currentText, { gmailRule: CONFIG.gmailRule });

  // 2. Scan moment animation
  triggerScan(() => {
    // 3. Render results
    renderResult(currentResult, {
      format: currentFormat,
      onSelectTab: (tabId) => {
        // Will be wired in Phase 3
      }
    });

    // 4. Mobile scroll to result card
    if (window.innerWidth < 1024) {
      const resultCard = document.getElementById("result-card");
      if (resultCard) {
        resultCard.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start"
        });
      }
    }
  });
}

function doClear() {
  currentText = "";
  currentResult = null;
  renderEmpty();
}

function setupThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  if (CONFIG.features && CONFIG.features.darkTheme === false) {
    toggleBtn.style.display = "none";
    return;
  }

  toggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  });
}

function setupBrandFallback() {
  const logo = document.getElementById("brand-logo");
  const fallback = document.getElementById("brand-fallback");
  if (!logo || !fallback) return;

  logo.addEventListener("error", () => {
    logo.style.display = "none";
    fallback.classList.remove("sr-only");
  });
}

// Rule 4: Clear box and results on pagehide
window.addEventListener("pagehide", () => {
  currentText = "";
  currentResult = null;
  const listEl = document.getElementById("list");
  if (listEl) listEl.value = "";
  renderEmpty();
});

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle();
  setupBrandFallback();

  const listEl = document.getElementById("list");

  initInputUI({
    onClean: (text) => doClean(text),
    onClear: () => doClear(),
    getText: () => currentText,
    setText: (newText) => {
      currentText = newText;
      if (listEl) listEl.value = newText;
    }
  });

  renderEmpty();

  initLoader(() => {
    // Shell ready
  });
});

export { currentText, currentResult };
