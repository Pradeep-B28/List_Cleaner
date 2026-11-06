// Input UI: text box, line count, sample, paste, open file, clear, clean
import { COPY, t } from "./copy.js";
import { CONFIG } from "../config.js";
import { fmt } from "./engine/cleaner.js";
import { SAMPLE_TEXT } from "./sample-data.js";

let noticeTimer = null;

export function initInputUI({ onClean, onClear, getText, setText }) {
  const listEl = document.getElementById("list");
  const lineCountBadge = document.getElementById("line-count");
  const noticeEl = document.getElementById("input-notice");
  const btnClean = document.getElementById("btn-clean");
  const btnMobile = document.getElementById("btn-clean-mobile");
  const btnSample = document.getElementById("btn-sample");
  const btnPaste = document.getElementById("btn-paste");
  const btnOpen = document.getElementById("btn-open");
  const fileInput = document.getElementById("file-input");
  const btnClear = document.getElementById("btn-clear");
  const mobileBar = document.getElementById("mobile-sticky-bar");

  function showNotice(msg) {
    if (!noticeEl) return;
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeEl.textContent = msg;
    noticeEl.classList.add("visible");
    noticeTimer = setTimeout(() => {
      noticeEl.classList.remove("visible");
      noticeEl.textContent = "";
      noticeTimer = null;
    }, 6000);
  }

  function pulseBox() {
    if (!listEl) return;
    listEl.classList.remove("pulse-paste");
    void listEl.offsetWidth;
    listEl.classList.add("pulse-paste");
    setTimeout(() => {
      listEl.classList.remove("pulse-paste");
    }, 450);
  }

  function updateLineCount(text) {
    if (!lineCountBadge) return;
    if (!text || text.length === 0) {
      lineCountBadge.textContent = t("input.lines", { lines: "0" });
      if (mobileBar) {
        mobileBar.classList.remove("visible");
        mobileBar.setAttribute("aria-hidden", "true");
      }
      return;
    }
    const lines = text.split(/\r\n|\r|\n/).length;
    lineCountBadge.textContent = t("input.lines", { lines: fmt(lines) });
    if (mobileBar) {
      mobileBar.classList.add("visible");
      mobileBar.removeAttribute("aria-hidden");
    }
  }

  // Textarea input event for live line count
  if (listEl) {
    listEl.addEventListener("input", () => {
      updateLineCount(listEl.value);
    });

    // Native paste event in text box
    listEl.addEventListener("paste", () => {
      pulseBox();
      setTimeout(() => {
        const val = listEl.value;
        updateLineCount(val);
        if (onClean) onClean(val);
      }, 0);
    });

    // Ctrl + Enter shortcut
    listEl.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (onClean) onClean(listEl.value);
      }
    });
  }

  // Clean button
  if (btnClean) {
    btnClean.addEventListener("click", () => {
      if (listEl && onClean) onClean(listEl.value);
    });
  }

  // Mobile sticky clean button
  if (btnMobile) {
    btnMobile.addEventListener("click", () => {
      if (listEl && onClean) onClean(listEl.value);
    });
  }

  // Try a messy sample
  if (btnSample) {
    btnSample.addEventListener("click", () => {
      if (setText) setText(SAMPLE_TEXT);
      else if (listEl) listEl.value = SAMPLE_TEXT;
      updateLineCount(SAMPLE_TEXT);
      pulseBox();
      if (onClean) onClean(SAMPLE_TEXT);
    });
  }

  // Paste button
  if (btnPaste && CONFIG.features?.pasteButton !== false) {
    btnPaste.addEventListener("click", () => {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        showNotice(COPY.input.pasteBlocked);
        return;
      }
      navigator.clipboard.readText()
        .then((clipText) => {
          if (!clipText) return;
          if (setText) setText(clipText);
          else if (listEl) listEl.value = clipText;
          updateLineCount(clipText);
          pulseBox();
          if (onClean) onClean(clipText);
        })
        .catch(() => {
          showNotice(COPY.input.pasteBlocked);
        });
    });
  }

  // Open a file button
  if (btnOpen && fileInput && CONFIG.features?.fileOpen !== false) {
    btnOpen.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".txt")) {
        showNotice(COPY.input.fileType);
        fileInput.value = "";
        return;
      }

      const maxMB = CONFIG.maxFileMB || 4;
      const maxBytes = maxMB * 1024 * 1024;
      if (file.size > maxBytes) {
        showNotice(t("input.fileTooBig", { mb: maxMB.toString() }));
        fileInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = typeof e.target?.result === "string" ? e.target.result : "";
        if (setText) setText(content);
        else if (listEl) listEl.value = content;
        updateLineCount(content);
        pulseBox();
        if (onClean) onClean(content);
        fileInput.value = "";
      };
      reader.readAsText(file);
    });
  }

  // Clear button
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      if (listEl) {
        listEl.classList.add("fade-clear");
        setTimeout(() => {
          if (setText) setText("");
          else listEl.value = "";
          updateLineCount("");
          listEl.classList.remove("fade-clear");
          if (onClear) onClear();
        }, 180);
      } else {
        if (onClear) onClear();
      }
    });
  }

  return {
    updateLineCount,
    showNotice,
    pulseBox
  };
}
