// Main entry point for List Cleaner
import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { fmt } from "./engine/cleaner.js";
import { getTheme, setTheme } from "./store.js";
import { initLoader } from "./motion.js";

// State holds the raw text and cleaned results only in memory (Rule 4)
let currentText = "";
let currentResult = null;

function updateLineCount(text) {
  const lineCountBadge = document.getElementById("line-count");
  if (!lineCountBadge) return;
  if (!text) {
    lineCountBadge.textContent = t("input.lines", { lines: "0" });
    return;
  }
  const lines = text.split(/\r\n|\r|\n/).length;
  lineCountBadge.textContent = t("input.lines", { lines: fmt(lines) });
}

function updateMobileStickyBar(hasText) {
  const stickyBar = document.getElementById("mobile-sticky-bar");
  if (!stickyBar) return;
  if (hasText) {
    stickyBar.classList.add("visible");
    stickyBar.removeAttribute("aria-hidden");
  } else {
    stickyBar.classList.remove("visible");
    stickyBar.setAttribute("aria-hidden", "true");
  }
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

function setupFeatureSwitches() {
  if (!CONFIG.features) return;
  if (CONFIG.features.pasteButton === false) {
    const pasteBtn = document.getElementById("btn-paste");
    if (pasteBtn) pasteBtn.style.display = "none";
  }
  if (CONFIG.features.fileOpen === false) {
    const openBtn = document.getElementById("btn-open");
    if (openBtn) openBtn.style.display = "none";
  }
}

function setupInputListeners() {
  const listEl = document.getElementById("list");
  if (!listEl) return;

  listEl.addEventListener("input", () => {
    currentText = listEl.value;
    updateLineCount(currentText);
    updateMobileStickyBar(currentText.trim().length > 0);
  });
}

// Rule 4: Clear box and results on pagehide
window.addEventListener("pagehide", () => {
  currentText = "";
  currentResult = null;
  const listEl = document.getElementById("list");
  if (listEl) listEl.value = "";
});

// Initialize shell
document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle();
  setupBrandFallback();
  setupFeatureSwitches();
  setupInputListeners();

  const listEl = document.getElementById("list");
  if (listEl) {
    updateLineCount(listEl.value);
  }

  initLoader(() => {
    // Shell ready
  });
});

export { currentText, currentResult };
