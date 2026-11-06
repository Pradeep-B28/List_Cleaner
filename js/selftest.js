// Self-test suite for ?test=1
import { SAMPLE_TEXT } from "./sample-data.js";
import { cleanList, toCsv } from "./engine/cleaner.js";
import { CONFIG } from "../config.js";
import { renderResult } from "./result-ui.js";
import { updateOutputResult, switchTab } from "./output-ui.js";
import { updateDsaStats } from "./sections-ui.js";

export async function runSelfTest() {
  const overlay = document.createElement("div");
  overlay.id = "selftest-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "16px";
  overlay.style.right = "16px";
  overlay.style.width = "calc(100% - 32px)";
  overlay.style.maxWidth = "560px";
  overlay.style.maxHeight = "90vh";
  overlay.style.overflowY = "auto";
  overlay.style.backgroundColor = "var(--surface)";
  overlay.style.border = "2px solid var(--brand)";
  overlay.style.borderRadius = "var(--radius-card)";
  overlay.style.boxShadow = "var(--shadow-lg)";
  overlay.style.zIndex = "10000";
  overlay.style.padding = "var(--space-lg)";
  overlay.style.fontFamily = "var(--font-mono)";
  overlay.style.fontSize = "0.8125rem";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "var(--space-md)";

  const title = document.createElement("h2");
  title.style.fontSize = "1rem";
  title.style.fontWeight = "800";
  title.style.margin = "0";
  title.textContent = "Self-Test Suite (?test=1)";
  header.appendChild(title);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "[Close]";
  closeBtn.style.color = "var(--muted)";
  closeBtn.style.fontWeight = "700";
  closeBtn.addEventListener("click", () => overlay.remove());
  header.appendChild(closeBtn);
  overlay.appendChild(header);

  const listEl = document.createElement("ol");
  listEl.style.paddingLeft = "20px";
  listEl.style.display = "flex";
  listEl.style.flexDirection = "column";
  listEl.style.gap = "8px";
  overlay.appendChild(listEl);

  function addResult(num, passed, name, detail = "") {
    const li = document.createElement("li");
    li.style.color = passed ? "var(--brand-strong)" : "var(--bad)";
    li.style.lineHeight = "1.4";

    const badge = document.createElement("strong");
    badge.textContent = passed ? "PASS " : "FAIL ";
    li.appendChild(badge);

    const txt = document.createElement("span");
    txt.textContent = name + (detail ? " - " + detail : "");
    li.appendChild(txt);

    listEl.appendChild(li);
    return passed;
  }

  // 1. Run sample through the real page code
  const sampleResult = cleanList(SAMPLE_TEXT, { gmailRule: CONFIG.gmailRule });
  renderResult(sampleResult, { format: CONFIG.defaultFormat });
  updateOutputResult(sampleResult);
  if (sampleResult.dsa) updateDsaStats(sampleResult.dsa);

  // Wait for count-up and merge moment animations to finish
  await new Promise(r => setTimeout(r, 800));

  const headlineEl = document.getElementById("result-headline");
  const splitEl = document.getElementById("result-split");
  const tiles = Array.from(document.querySelectorAll(".stat-tile .stat-val")).map(el => el.textContent.trim());

  const hOk = headlineEl?.textContent === "1,240 entries, 312 duplicates removed.";
  const sOk = splitEl?.textContent === "640 phone numbers and 247 emails";
  const tOk = tiles[0] === "887" && tiles[1] === "312" && tiles[2] === "400" && tiles[3] === "41";
  addResult(1, hOk && sOk && tOk, "1. Sample headline and tiles", `Tiles: ${tiles.join(", ")}`);

  // 2. DSA cards show exact metrics
  const hashLive = document.getElementById("dsa-hash-live")?.textContent || "";
  const sortLive = document.getElementById("dsa-sort-live")?.textContent || "";
  const dsaOk = hashLive.includes("1,199") && hashLive.includes("7,18,201") && sortLive.includes("7,602");
  addResult(2, dsaOk, "2. DSA cards live metrics", `${hashLive}; ${sortLive}`);

  // 3. Merge moment shows a contact with "4 times"
  const mergeWrap = document.getElementById("merge-moment-wrap")?.textContent || "";
  const mergeOk = mergeWrap.includes("4 times");
  addResult(3, mergeOk, "3. Merge moment contact repeat badge", `Merge text: ${mergeWrap}`);

  // 4. Preview shows 500 rows and footer line
  const rows = document.querySelectorAll("#clean-preview-list .preview-row").length;
  const footerText = document.getElementById("clean-preview-footer")?.textContent || "";
  const pOk = rows === 500 && footerText.includes("Showing the first 500 of 887.");
  addResult(4, pOk, "4. Preview rows and pagination line", `${rows} rows; ${footerText}`);

  // 5. toCsv with default options has 888 lines plus a final line break
  const csv = toCsv(sampleResult, {
    format: CONFIG.defaultFormat,
    order: "sorted",
    filter: "all"
  });
  const csvParts = csv.split("\r\n");
  const csvOk = csv.endsWith("\r\n") && csvParts.length === 890 && csvParts[csvParts.length - 1] === "";
  // Note: 1 header row + 887 kept contacts = 888 lines. When split by \r\n, 888 lines + trailing empty = 889 or 890.
  // Let's verify line count: lines minus empty trailing line.
  const csvLines = csv.trimEnd().split(/\r\n|\r|\n/);
  const csvCountOk = csvLines.length === 888 && csv.endsWith("\r\n");
  addResult(5, csvCountOk, "5. toCsv lines count (888 lines + final line break)", `${csvLines.length} lines`);

  // 6. Privacy check: no phone number or email in storage, url, title, or live region
  let leakFound = false;
  const sampleContacts = sampleResult.kept.map(k => k.value);
  const checkStringForLeak = (str) => {
    if (!str) return false;
    for (const val of sampleContacts) {
      if (str.includes(val)) return true;
    }
    return false;
  };

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k);
      if (checkStringForLeak(k) || checkStringForLeak(v)) leakFound = true;
    }
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      const v = sessionStorage.getItem(k);
      if (checkStringForLeak(k) || checkStringForLeak(v)) leakFound = true;
    }
  } catch (e) {}

  if (checkStringForLeak(window.location.href)) leakFound = true;
  if (checkStringForLeak(document.title)) leakFound = true;
  const announcer = document.getElementById("live-announcer")?.textContent || "";
  if (checkStringForLeak(announcer)) leakFound = true;

  addResult(6, !leakFound, "6. No contact leaks in storage, url, title, or aria-live");

  // 7. fetch() is refused by CSP privacy lock
  let fetchBlocked = false;
  try {
    await fetch("https://wrench-wise.com/", { mode: "no-cors" });
  } catch (err) {
    fetchBlocked = true;
  }
  addResult(7, fetchBlocked, "7. Outside fetch refused by privacy lock");

  // 8. Storage holds only allowed keys
  let storageKeysOk = true;
  const allowedKeys = new Set(["lc-theme", "lc-format", "lc-intro-seen"]);
  try {
    for (let i = 0; i < localStorage.length; i++) {
      if (!allowedKeys.has(localStorage.key(i))) storageKeysOk = false;
    }
    for (let i = 0; i < sessionStorage.length; i++) {
      if (!allowedKeys.has(sessionStorage.key(i))) storageKeysOk = false;
    }
  } catch (e) {}
  addResult(8, storageKeysOk, "8. Storage holds only allowed keys (lc-theme, lc-format, lc-intro-seen)");

  // 9. No horizontal overflow
  const noOverflow = document.documentElement.scrollWidth <= window.innerWidth;
  addResult(9, noOverflow, "9. No horizontal overflow (scrollWidth <= innerWidth)", `${document.documentElement.scrollWidth}px <= ${window.innerWidth}px`);

  // 10. Typing <img src=1> is treated as plain text and injects no img
  const xssInput = "<img src=1>";
  const xssResult = cleanList(xssInput, { gmailRule: CONFIG.gmailRule });
  renderResult(xssResult, { format: CONFIG.defaultFormat });
  updateOutputResult(xssResult);
  switchTab("invalid");

  const invalidPanel = document.getElementById("panel-invalid");
  const hasRawText = invalidPanel?.textContent.includes("<img src=1>");
  const injectedImg = document.querySelector('img[src="1"], img[src="http://localhost:4123/1"]');
  const xssSafe = hasRawText && !injectedImg;
  addResult(10, xssSafe, "10. HTML in input rendered as plain text without image injection");

  // Restore sample state on page
  renderResult(sampleResult, { format: CONFIG.defaultFormat });
  updateOutputResult(sampleResult);
  switchTab("clean");

  document.body.appendChild(overlay);
}
