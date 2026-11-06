// Output UI: format, filter, order, separator, preview, copy, download, and tab navigation
import { COPY, t } from "./copy.js";
import { fmt, formatItem, toText, toCsv, PHONE_FORMATS } from "./engine/cleaner.js";
import { CONFIG } from "../config.js";
import { getFormat, setFormat } from "./store.js";
import { renderDuplicatesTab, renderFixedTab, renderInvalidTab } from "./details-ui.js";

let state = {
  format: getFormat() || CONFIG.defaultFormat || "e164",
  filter: "all",
  order: "sorted",
  separator: "lines",
  activeTab: "clean"
};

let currentResult = null;
let onFormatChangeCallback = null;

export function initOutputUI(container, { onFormatChange } = {}) {
  onFormatChangeCallback = onFormatChange;
  renderShell(container);
}

export function updateOutputResult(result) {
  currentResult = result;
  const section = document.getElementById("output-panel-section");
  if (!section) return;

  if (!result || result.empty) {
    section.classList.remove("visible");
    section.setAttribute("aria-hidden", "true");
    return;
  }

  section.classList.add("visible");
  section.removeAttribute("aria-hidden");

  // Update tabs content
  renderActiveTab();
}

export function switchTab(tabId) {
  const allowed = ["clean", "duplicates", "fixed", "invalid"];
  if (!allowed.includes(tabId)) return;
  state.activeTab = tabId;

  const tabBtns = document.querySelectorAll(".tab-btn");
  for (const btn of tabBtns) {
    const isSelected = btn.getAttribute("data-tab") === tabId;
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    btn.tabIndex = isSelected ? 0 : -1;
    if (isSelected) updateTabIndicator(btn);
  }

  const panels = document.querySelectorAll(".tabpanel");
  for (const p of panels) {
    if (p.id === "panel-" + tabId) {
      p.classList.add("active");
    } else {
      p.classList.remove("active");
    }
  }

  renderActiveTab();
}

function updateTabIndicator(activeBtn) {
  const indicator = document.getElementById("tab-indicator");
  if (!indicator || !activeBtn) return;
  indicator.style.left = activeBtn.offsetLeft + "px";
  indicator.style.width = activeBtn.offsetWidth + "px";
}

function renderShell(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const card = document.createElement("div");
  card.className = "output-card";

  // Tablist
  const tablist = document.createElement("div");
  tablist.className = "tablist-nav";
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", "Output options and details");

  const tabsMeta = [
    { id: "clean", label: COPY.tabs.clean },
    { id: "duplicates", label: COPY.tabs.duplicates },
    { id: "fixed", label: COPY.tabs.fixed },
    { id: "invalid", label: COPY.tabs.invalid }
  ];

  for (const meta of tabsMeta) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab-btn";
    btn.setAttribute("role", "tab");
    btn.setAttribute("id", "tab-" + meta.id);
    btn.setAttribute("aria-controls", "panel-" + meta.id);
    btn.setAttribute("data-tab", meta.id);
    const isSelected = meta.id === state.activeTab;
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    btn.tabIndex = isSelected ? 0 : -1;
    btn.textContent = meta.label;

    btn.addEventListener("click", () => {
      switchTab(meta.id);
    });

    tablist.appendChild(btn);
  }

  const indicator = document.createElement("div");
  indicator.id = "tab-indicator";
  indicator.className = "tab-indicator";
  tablist.appendChild(indicator);
  card.appendChild(tablist);

  // Arrow key navigation for tabs (Rule 218)
  tablist.addEventListener("keydown", (e) => {
    const tabBtns = [...tablist.querySelectorAll(".tab-btn")];
    const currentIndex = tabBtns.findIndex(b => b.getAttribute("data-tab") === state.activeTab);
    if (currentIndex === -1) return;

    let nextIndex = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabBtns.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabBtns.length) % tabBtns.length;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const targetBtn = tabBtns[nextIndex];
      targetBtn.focus();
      switchTab(targetBtn.getAttribute("data-tab"));
    }
  });

  // Tab Panels Container
  // 1. Clean list Panel
  const panelClean = document.createElement("div");
  panelClean.id = "panel-clean";
  panelClean.className = "tabpanel " + (state.activeTab === "clean" ? "active" : "");
  panelClean.setAttribute("role", "tabpanel");
  panelClean.setAttribute("aria-labelledby", "tab-clean");
  renderCleanPanelStructure(panelClean);
  card.appendChild(panelClean);

  // 2. Duplicates Panel
  const panelDup = document.createElement("div");
  panelDup.id = "panel-duplicates";
  panelDup.className = "tabpanel " + (state.activeTab === "duplicates" ? "active" : "");
  panelDup.setAttribute("role", "tabpanel");
  panelDup.setAttribute("aria-labelledby", "tab-duplicates");
  card.appendChild(panelDup);

  // 3. Tidied Panel
  const panelFixed = document.createElement("div");
  panelFixed.id = "panel-fixed";
  panelFixed.className = "tabpanel " + (state.activeTab === "fixed" ? "active" : "");
  panelFixed.setAttribute("role", "tabpanel");
  panelFixed.setAttribute("aria-labelledby", "tab-fixed");
  card.appendChild(panelFixed);

  // 4. Need a look Panel
  const panelInvalid = document.createElement("div");
  panelInvalid.id = "panel-invalid";
  panelInvalid.className = "tabpanel " + (state.activeTab === "invalid" ? "active" : "");
  panelInvalid.setAttribute("role", "tabpanel");
  panelInvalid.setAttribute("aria-labelledby", "tab-invalid");
  card.appendChild(panelInvalid);

  container.appendChild(card);

  // Initialize indicator position
  setTimeout(() => {
    const activeBtn = tablist.querySelector('.tab-btn[aria-selected="true"]');
    if (activeBtn) updateTabIndicator(activeBtn);
  }, 50);
}

function renderCleanPanelStructure(panel) {
  // Controls bar
  const controls = document.createElement("div");
  controls.className = "output-controls";

  // Phone format group
  const formatGroup = document.createElement("div");
  formatGroup.className = "control-group";
  const formatLabel = document.createElement("span");
  formatLabel.className = "control-label";
  formatLabel.textContent = COPY.output.format;
  formatGroup.appendChild(formatLabel);

  const formatPills = document.createElement("div");
  formatPills.className = "pill-group";
  for (const fmtKey of PHONE_FORMATS) {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "pill-btn " + (state.format === fmtKey ? "active" : "");
    pill.textContent = COPY.output.formats[fmtKey] || fmtKey;
    pill.setAttribute("data-format", fmtKey);

    pill.addEventListener("click", () => {
      state.format = fmtKey;
      setFormat(fmtKey);
      for (const p of formatPills.querySelectorAll(".pill-btn")) {
        p.classList.toggle("active", p.getAttribute("data-format") === fmtKey);
      }
      updateFormatNote();
      renderPreviewList();
      if (onFormatChangeCallback) onFormatChangeCallback(fmtKey);
    });

    formatPills.appendChild(pill);
  }
  formatGroup.appendChild(formatPills);
  controls.appendChild(formatGroup);

  // Format note
  const formatNote = document.createElement("div");
  formatNote.id = "format-note";
  formatNote.className = "format-note";
  controls.appendChild(formatNote);

  // Show filter group (All, Phones, Emails)
  const showGroup = document.createElement("div");
  showGroup.className = "control-group";
  const showLabel = document.createElement("span");
  showLabel.className = "control-label";
  showLabel.textContent = COPY.output.show;
  showGroup.appendChild(showLabel);

  const showPills = document.createElement("div");
  showPills.className = "pill-group";
  const filterDefs = [
    { key: "all", label: COPY.output.all },
    { key: "phones", label: COPY.output.phones },
    { key: "emails", label: COPY.output.emails }
  ];
  for (const f of filterDefs) {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "pill-btn " + (state.filter === f.key ? "active" : "");
    pill.textContent = f.label;
    pill.setAttribute("data-filter", f.key);

    pill.addEventListener("click", () => {
      state.filter = f.key;
      for (const p of showPills.querySelectorAll(".pill-btn")) {
        p.classList.toggle("active", p.getAttribute("data-filter") === f.key);
      }
      renderPreviewList();
    });

    showPills.appendChild(pill);
  }
  showGroup.appendChild(showPills);
  controls.appendChild(showGroup);

  // Order group (A to Z, As pasted)
  const orderGroup = document.createElement("div");
  orderGroup.className = "control-group";
  const orderLabel = document.createElement("span");
  orderLabel.className = "control-label";
  orderLabel.textContent = COPY.output.order;
  orderGroup.appendChild(orderLabel);

  const orderPills = document.createElement("div");
  orderPills.className = "pill-group";
  const orderDefs = [
    { key: "sorted", label: COPY.output.sorted },
    { key: "asPasted", label: COPY.output.asPasted }
  ];
  for (const o of orderDefs) {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "pill-btn " + (state.order === o.key ? "active" : "");
    pill.textContent = o.label;
    pill.setAttribute("data-order", o.key);

    pill.addEventListener("click", () => {
      state.order = o.key;
      for (const p of orderPills.querySelectorAll(".pill-btn")) {
        p.classList.toggle("active", p.getAttribute("data-order") === o.key);
      }
      renderPreviewList();
    });

    orderPills.appendChild(pill);
  }
  orderGroup.appendChild(orderPills);
  controls.appendChild(orderGroup);

  // Separate with group (New lines, Commas)
  const sepGroup = document.createElement("div");
  sepGroup.className = "control-group";
  const sepLabel = document.createElement("span");
  sepLabel.className = "control-label";
  sepLabel.textContent = COPY.output.separator;
  sepGroup.appendChild(sepLabel);

  const sepPills = document.createElement("div");
  sepPills.className = "pill-group";
  const sepDefs = [
    { key: "lines", label: COPY.output.lines },
    { key: "commas", label: COPY.output.commas }
  ];
  for (const s of sepDefs) {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "pill-btn " + (state.separator === s.key ? "active" : "");
    pill.textContent = s.label;
    pill.setAttribute("data-sep", s.key);

    pill.addEventListener("click", () => {
      state.separator = s.key;
      for (const p of sepPills.querySelectorAll(".pill-btn")) {
        p.classList.toggle("active", p.getAttribute("data-sep") === s.key);
      }
      renderPreviewList();
    });

    sepPills.appendChild(pill);
  }
  sepGroup.appendChild(sepPills);
  controls.appendChild(sepGroup);

  panel.appendChild(controls);

  // Preview container
  const previewBox = document.createElement("div");
  previewBox.className = "preview-container";

  const previewList = document.createElement("div");
  previewList.id = "clean-preview-list";
  previewList.className = "preview-list";
  previewBox.appendChild(previewList);

  const previewFooter = document.createElement("div");
  previewFooter.id = "clean-preview-footer";
  previewFooter.className = "preview-footer";
  previewBox.appendChild(previewFooter);

  panel.appendChild(previewBox);

  // Actions row: Copy, Download CSV, Download TXT, Excel Tip
  const actionsRow = document.createElement("div");
  actionsRow.className = "output-actions-row";

  const btnsWrap = document.createElement("div");
  btnsWrap.className = "output-buttons-wrap";

  // Copy button
  const btnCopy = document.createElement("button");
  btnCopy.type = "button";
  btnCopy.id = "btn-copy";
  btnCopy.className = "btn btn-primary";

  const copyIcon = document.createElement("span");
  copyIcon.className = "btn-icon";
  copyIcon.appendChild(createSvgIcon("copy"));
  btnCopy.appendChild(copyIcon);

  const copyText = document.createElement("span");
  copyText.id = "btn-copy-text";
  copyText.textContent = COPY.output.copy;
  btnCopy.appendChild(copyText);

  btnCopy.addEventListener("click", handleCopy);
  btnsWrap.appendChild(btnCopy);

  // Download CSV button
  const btnCsv = document.createElement("button");
  btnCsv.type = "button";
  btnCsv.id = "btn-download-csv";
  btnCsv.className = "btn btn-secondary btn-download";
  btnCsv.appendChild(createSvgIcon("download"));
  const csvText = document.createElement("span");
  csvText.textContent = COPY.output.csv;
  btnCsv.appendChild(csvText);

  btnCsv.addEventListener("click", handleDownloadCsv);
  btnsWrap.appendChild(btnCsv);

  // Download TXT button
  const btnTxt = document.createElement("button");
  btnTxt.type = "button";
  btnTxt.id = "btn-download-txt";
  btnTxt.className = "btn btn-secondary btn-download";
  btnTxt.appendChild(createSvgIcon("download"));
  const txtSpan = document.createElement("span");
  txtSpan.textContent = COPY.output.txt;
  btnTxt.appendChild(txtSpan);

  btnTxt.addEventListener("click", handleDownloadTxt);
  btnsWrap.appendChild(btnTxt);

  actionsRow.appendChild(btnsWrap);

  // Excel Tip
  const tip = document.createElement("p");
  tip.className = "excel-tip";
  tip.textContent = COPY.output.excelTip;
  actionsRow.appendChild(tip);

  panel.appendChild(actionsRow);

  updateFormatNote();
}

function updateFormatNote() {
  const noteEl = document.getElementById("format-note");
  if (noteEl) {
    noteEl.textContent = COPY.output.formatNotes[state.format] || "";
  }
}

function renderActiveTab() {
  if (!currentResult || currentResult.empty) return;

  if (state.activeTab === "clean") {
    renderPreviewList();
  } else if (state.activeTab === "duplicates") {
    const p = document.getElementById("panel-duplicates");
    if (p) renderDuplicatesTab(p, currentResult, state.format);
  } else if (state.activeTab === "fixed") {
    const p = document.getElementById("panel-fixed");
    if (p) renderFixedTab(p, currentResult, state.format);
  } else if (state.activeTab === "invalid") {
    const p = document.getElementById("panel-invalid");
    if (p) renderInvalidTab(p, currentResult);
  }
}

function renderPreviewList() {
  const listEl = document.getElementById("clean-preview-list");
  const footerEl = document.getElementById("clean-preview-footer");
  if (!listEl || !footerEl || !currentResult) return;

  while (listEl.firstChild) {
    listEl.removeChild(listEl.firstChild);
  }

  // Get source array based on order
  const source = state.order === "asPasted" ? (currentResult.kept || []) : (currentResult.sorted || []);

  // Filter contacts
  const filtered = source.filter(item => {
    if (state.filter === "phones") return item.type === "phone";
    if (state.filter === "emails") return item.type === "email";
    return true;
  });

  if (filtered.length === 0) {
    const emptyNotice = document.createElement("div");
    emptyNotice.className = "preview-empty";
    emptyNotice.textContent = COPY.output.nothing;
    listEl.appendChild(emptyNotice);
    footerEl.style.display = "none";
    return;
  }

  const maxPreview = CONFIG.previewRows || 500;
  const slice = filtered.slice(0, maxPreview);

  const fragment = document.createDocumentFragment();
  for (const item of slice) {
    const row = document.createElement("div");
    row.className = "preview-row";
    row.textContent = formatItem(item, state.format);
    fragment.appendChild(row);
  }
  listEl.appendChild(fragment);

  // Footer preview limit count
  if (filtered.length > maxPreview) {
    footerEl.style.display = "block";
    footerEl.textContent = t("output.preview", {
      shown: fmt(maxPreview),
      total: fmt(filtered.length)
    });
  } else {
    footerEl.style.display = "none";
  }
}

function handleCopy() {
  if (!currentResult || currentResult.empty) return;
  const text = toText(currentResult, {
    format: state.format,
    order: state.order,
    filter: state.filter,
    separator: state.separator
  });

  const btnText = document.getElementById("btn-copy-text");
  const copyBtn = document.getElementById("btn-copy");

  navigator.clipboard.writeText(text)
    .then(() => {
      if (btnText && copyBtn) {
        btnText.textContent = COPY.output.copied;
        const iconSpan = copyBtn.querySelector(".btn-icon");
        if (iconSpan) {
          while (iconSpan.firstChild) iconSpan.removeChild(iconSpan.firstChild);
          iconSpan.appendChild(createSvgIcon("check"));
        }
        setTimeout(() => {
          btnText.textContent = COPY.output.copy;
          if (iconSpan) {
            while (iconSpan.firstChild) iconSpan.removeChild(iconSpan.firstChild);
            iconSpan.appendChild(createSvgIcon("copy"));
          }
        }, 1500);
      }
    })
    .catch(() => {
      if (btnText) {
        btnText.textContent = COPY.output.copyFailed;
        setTimeout(() => {
          btnText.textContent = COPY.output.copy;
        }, 2500);
      }
    });
}

function handleDownloadCsv() {
  if (!currentResult || currentResult.empty) return;
  const csvText = toCsv(currentResult, {
    format: state.format,
    order: state.order,
    filter: state.filter
  });

  const btn = document.getElementById("btn-download-csv");
  if (btn) {
    btn.classList.add("dropping");
    setTimeout(() => btn.classList.remove("dropping"), 400);
  }

  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, "clean-list.csv");
}

function handleDownloadTxt() {
  if (!currentResult || currentResult.empty) return;
  const txtText = toText(currentResult, {
    format: state.format,
    order: state.order,
    filter: state.filter,
    separator: state.separator
  });

  const btn = document.getElementById("btn-download-txt");
  if (btn) {
    btn.classList.add("dropping");
    setTimeout(() => btn.classList.remove("dropping"), 400);
  }

  const blob = new Blob([txtText], { type: "text/plain;charset=utf-8;" });
  downloadBlob(blob, "clean-list.txt");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createSvgIcon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  if (name === "copy") {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "9");
    rect.setAttribute("y", "9");
    rect.setAttribute("width", "13");
    rect.setAttribute("height", "13");
    rect.setAttribute("rx", "2");
    rect.setAttribute("ry", "2");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1");
    svg.appendChild(rect);
    svg.appendChild(path);
  } else if (name === "check") {
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", "20 6 9 17 4 12");
    svg.appendChild(polyline);
  } else if (name === "download") {
    const pathArrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathArrow.setAttribute("class", "arrow");
    pathArrow.setAttribute("d", "M12 15V3m0 12l-4-4m4 4l4-4");
    const pathTray = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathTray.setAttribute("d", "M2 17l.62 2.48A2 2 0 0 0 4.56 21h14.88a2 2 0 0 0 1.94-1.52L22 17");
    svg.appendChild(pathArrow);
    svg.appendChild(pathTray);
  }

  return svg;
}

export function getCurrentFormat() {
  return state.format;
}
