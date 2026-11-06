// Details UI: Duplicates, Tidied, and Need a look tabs
import { COPY, t } from "./copy.js";
import { fmt, formatItem } from "./engine/cleaner.js";
import { CONFIG } from "../config.js";

const MAX_DETAIL_ROWS = 200;

export function renderDuplicatesTab(container, result, currentFormat) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const repeats = result?.repeats || [];
  if (repeats.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "detail-empty-msg";
    emptyMsg.textContent = COPY.details.duplicatesEmpty;
    container.appendChild(emptyMsg);
    return;
  }

  // Show Gmail explanation once if any repeated contact is Gmail and gmailRule is enabled
  const hasGmailRepeat = CONFIG.gmailRule && repeats.some(r => r.type === "email" && r.value.endsWith("@gmail.com"));
  if (hasGmailRepeat) {
    const callout = document.createElement("div");
    callout.className = "gmail-callout";
    callout.textContent = COPY.details.gmail;
    container.appendChild(callout);
  }

  const list = document.createElement("div");
  list.className = "detail-list";
  const fragment = document.createDocumentFragment();

  const slice = repeats.slice(0, MAX_DETAIL_ROWS);
  for (const r of slice) {
    const row = document.createElement("div");
    row.className = "detail-row";

    const top = document.createElement("div");
    top.style.display = "flex";
    top.style.alignItems = "center";
    top.style.justifyContent = "space-between";
    top.style.width = "100%";

    const prim = document.createElement("span");
    prim.className = "detail-primary";
    prim.textContent = formatItem(r, currentFormat || CONFIG.defaultFormat);
    top.appendChild(prim);

    const badge = document.createElement("span");
    badge.className = "merge-badge";
    badge.textContent = t("result.mergeTimes", { count: fmt(r.removed + 1) });
    top.appendChild(badge);

    row.appendChild(top);

    if (r.seenAs && r.seenAs.length > 0) {
      const varsWrap = document.createElement("div");
      varsWrap.className = "detail-variants";

      const label = document.createElement("span");
      label.textContent = COPY.details.alsoAs + ": ";
      varsWrap.appendChild(label);

      for (const variant of r.seenAs) {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = variant;
        varsWrap.appendChild(chip);
      }
      row.appendChild(varsWrap);
    }

    fragment.appendChild(row);
  }

  list.appendChild(fragment);
  container.appendChild(list);

  if (repeats.length > MAX_DETAIL_ROWS) {
    const note = document.createElement("div");
    note.className = "detail-limit-note";
    note.textContent = t("details.limit", {
      shown: fmt(MAX_DETAIL_ROWS),
      total: fmt(repeats.length)
    });
    container.appendChild(note);
  }
}

export function renderFixedTab(container, result, currentFormat) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const fixes = result?.fixes || [];
  if (fixes.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "detail-empty-msg";
    emptyMsg.textContent = COPY.details.fixedEmpty;
    container.appendChild(emptyMsg);
    return;
  }

  const list = document.createElement("div");
  list.className = "detail-list";
  const fragment = document.createDocumentFragment();

  const slice = fixes.slice(0, MAX_DETAIL_ROWS);
  for (const f of slice) {
    const row = document.createElement("div");
    row.className = "detail-row";

    const comp = document.createElement("div");
    comp.className = "table-comparison";

    // Before column
    const colBefore = document.createElement("div");
    const labelBefore = document.createElement("div");
    labelBefore.className = "table-col-label";
    labelBefore.textContent = COPY.details.before;
    const valBefore = document.createElement("div");
    valBefore.className = "table-col-val";
    valBefore.textContent = f.raw;
    colBefore.appendChild(labelBefore);
    colBefore.appendChild(valBefore);
    comp.appendChild(colBefore);

    // After column
    const colAfter = document.createElement("div");
    const labelAfter = document.createElement("div");
    labelAfter.className = "table-col-label";
    labelAfter.textContent = COPY.details.after;
    const valAfter = document.createElement("div");
    valAfter.className = "table-col-val";
    valAfter.textContent = formatItem(f, currentFormat || CONFIG.defaultFormat);
    colAfter.appendChild(labelAfter);
    colAfter.appendChild(valAfter);
    comp.appendChild(colAfter);

    row.appendChild(comp);
    fragment.appendChild(row);
  }

  list.appendChild(fragment);
  container.appendChild(list);

  if (fixes.length > MAX_DETAIL_ROWS) {
    const note = document.createElement("div");
    note.className = "detail-limit-note";
    note.textContent = t("details.limit", {
      shown: fmt(MAX_DETAIL_ROWS),
      total: fmt(fixes.length)
    });
    container.appendChild(note);
  }
}

export function renderInvalidTab(container, result) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const invalid = result?.invalid || [];
  if (invalid.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "detail-empty-msg";
    emptyMsg.textContent = COPY.details.invalidEmpty;
    container.appendChild(emptyMsg);
    return;
  }

  const list = document.createElement("div");
  list.className = "detail-list";
  const fragment = document.createDocumentFragment();

  const slice = invalid.slice(0, MAX_DETAIL_ROWS);
  for (const inv of slice) {
    const row = document.createElement("div");
    row.className = "detail-row";

    const top = document.createElement("div");
    top.style.display = "flex";
    top.style.alignItems = "center";
    top.style.justifyContent = "space-between";
    top.style.width = "100%";

    const raw = document.createElement("span");
    raw.className = "table-col-val";
    raw.textContent = inv.raw;
    top.appendChild(raw);

    const reasonMeta = COPY.reasons[inv.reason] || { title: inv.reason, detail: "" };

    const badge = document.createElement("span");
    badge.className = "invalid-reason-badge";
    badge.textContent = reasonMeta.title;
    top.appendChild(badge);

    row.appendChild(top);

    if (reasonMeta.detail) {
      const detail = document.createElement("div");
      detail.className = "invalid-detail";
      detail.textContent = reasonMeta.detail;
      row.appendChild(detail);
    }

    fragment.appendChild(row);
  }

  list.appendChild(fragment);
  container.appendChild(list);

  if (invalid.length > MAX_DETAIL_ROWS) {
    const note = document.createElement("div");
    note.className = "detail-limit-note";
    note.textContent = t("details.limit", {
      shown: fmt(MAX_DETAIL_ROWS),
      total: fmt(invalid.length)
    });
    container.appendChild(note);
  }
}
