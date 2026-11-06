// Result UI: headline, count-up, stat tiles, ratio bar, merge moment
import { COPY, t } from "./copy.js";
import { fmt, formatItem, MAX_ENTRIES } from "./engine/cleaner.js";
import { CONFIG } from "../config.js";
import { countUpHeadline, countUpNumber, prefersReducedMotion } from "./motion.js";

export function renderEmpty() {
  const resultEmpty = document.getElementById("result-empty");
  const resultLive = document.getElementById("result-live");
  const announcer = document.getElementById("live-announcer");

  if (resultEmpty) resultEmpty.style.display = "flex";
  if (resultLive) {
    resultLive.classList.remove("visible", "animated");
    resultLive.style.display = "none";
  }
  if (announcer) announcer.textContent = "";
}

export function renderResult(result, options = {}) {
  const resultEmpty = document.getElementById("result-empty");
  const resultLive = document.getElementById("result-live");
  const headlineEl = document.getElementById("result-headline");
  const splitEl = document.getElementById("result-split");
  const tilesGrid = document.getElementById("stat-tiles-grid");
  const barWrap = document.getElementById("result-bar-wrap");
  const mergeWrap = document.getElementById("merge-moment-wrap");
  const skippedEl = document.getElementById("result-skipped-note");
  const truncatedEl = document.getElementById("result-truncated-note");
  const announcer = document.getElementById("live-announcer");

  if (!result || result.empty) {
    renderEmpty();
    return;
  }

  if (resultEmpty) resultEmpty.style.display = "none";
  if (resultLive) {
    resultLive.style.display = "flex";
    resultLive.classList.remove("animated");
    // Force reflow for stagger animations
    void resultLive.offsetWidth;
    resultLive.classList.add("visible", "animated");
  }

  // 1. Headline count-up
  const countDuration = prefersReducedMotion() ? 0 : (CONFIG.countUpMs || 700);
  if (headlineEl) {
    countUpHeadline(headlineEl, result.headline, countDuration);
  }

  // Polite announcement (Rule 218 & Rule 4: only announces result.headline)
  if (announcer) {
    announcer.textContent = result.headline;
  }

  // 2. Split line
  if (splitEl) {
    splitEl.textContent = t("result.split", {
      phones: fmt(result.counts.phones),
      emails: fmt(result.counts.emails)
    });
  }

  // 3. Four stat tiles
  if (tilesGrid) {
    while (tilesGrid.firstChild) {
      tilesGrid.removeChild(tilesGrid.firstChild);
    }

    const fragment = document.createDocumentFragment();
    const tileDefs = [
      { id: "clean", key: "kept", val: result.counts.kept, label: COPY.result.kept, cls: "stat-tile-kept" },
      { id: "duplicates", key: "dup", val: result.counts.duplicates, label: COPY.result.duplicates, cls: "stat-tile-dup" },
      { id: "fixed", key: "fixed", val: result.counts.fixed, label: COPY.result.fixed, cls: "stat-tile-fixed" },
      { id: "invalid", key: "invalid", val: result.counts.invalid, label: COPY.result.invalid, cls: "stat-tile-bad" }
    ];

    for (const def of tileDefs) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "stat-tile " + def.cls;
      tile.setAttribute("role", "button");
      tile.setAttribute("aria-label", def.label + ": " + fmt(def.val));

      const valSpan = document.createElement("span");
      valSpan.className = "stat-val tabular";
      tile.appendChild(valSpan);

      const labelSpan = document.createElement("span");
      labelSpan.className = "stat-label";
      labelSpan.textContent = def.label;
      tile.appendChild(labelSpan);

      countUpNumber(valSpan, def.val, countDuration);

      if (options.onSelectTab) {
        tile.addEventListener("click", () => {
          options.onSelectTab(def.id);
        });
      }

      fragment.appendChild(tile);
    }
    tilesGrid.appendChild(fragment);
  }

  // 4. Stacked Ratio Bar
  if (barWrap) {
    while (barWrap.firstChild) {
      barWrap.removeChild(barWrap.firstChild);
    }

    const total = result.counts.total;
    if (total > 0) {
      const barSec = document.createElement("div");
      barSec.className = "result-bar-section";

      const barOuter = document.createElement("div");
      barOuter.className = "stacked-bar-wrap";

      const keptPct = (result.counts.kept / total) * 100;
      const dupPct = (result.counts.duplicates / total) * 100;
      const invPct = (result.counts.invalid / total) * 100;

      // Part 1: Kept
      if (result.counts.kept > 0) {
        const pKept = document.createElement("div");
        pKept.className = "bar-part bar-part-kept animate-bar";
        pKept.style.width = keptPct + "%";
        if (keptPct >= 12) {
          pKept.textContent = COPY.result.barKept + " " + fmt(result.counts.kept);
        }
        barOuter.appendChild(pKept);
      }

      // Part 2: Duplicates
      if (result.counts.duplicates > 0) {
        const pDup = document.createElement("div");
        pDup.className = "bar-part bar-part-dup animate-bar";
        pDup.style.width = dupPct + "%";
        if (dupPct >= 12) {
          pDup.textContent = COPY.result.barDuplicates + " " + fmt(result.counts.duplicates);
        }
        barOuter.appendChild(pDup);
      }

      // Part 3: Need a look
      if (result.counts.invalid > 0) {
        const pInv = document.createElement("div");
        pInv.className = "bar-part bar-part-bad animate-bar";
        pInv.style.width = invPct + "%";
        if (invPct >= 12) {
          pInv.textContent = COPY.result.barInvalid + " " + fmt(result.counts.invalid);
        }
        barOuter.appendChild(pInv);
      }

      barSec.appendChild(barOuter);

      // Bar legend
      const legend = document.createElement("div");
      legend.className = "stacked-bar-legend";

      const lKept = document.createElement("span");
      lKept.className = "legend-item";
      const dotKept = document.createElement("span");
      dotKept.className = "legend-dot legend-dot-kept";
      lKept.appendChild(dotKept);
      lKept.appendChild(document.createTextNode(COPY.result.barKept + ": " + fmt(result.counts.kept)));
      legend.appendChild(lKept);

      const lDup = document.createElement("span");
      lDup.className = "legend-item";
      const dotDup = document.createElement("span");
      dotDup.className = "legend-dot legend-dot-dup";
      lDup.appendChild(dotDup);
      lDup.appendChild(document.createTextNode(COPY.result.barDuplicates + ": " + fmt(result.counts.duplicates)));
      legend.appendChild(lDup);

      const lBad = document.createElement("span");
      lBad.className = "legend-item";
      const dotBad = document.createElement("span");
      dotBad.className = "legend-dot legend-dot-bad";
      lBad.appendChild(dotBad);
      lBad.appendChild(document.createTextNode(COPY.result.barInvalid + ": " + fmt(result.counts.invalid)));
      legend.appendChild(lBad);

      barSec.appendChild(legend);
      barWrap.appendChild(barSec);
    }
  }

  // 5. Merge Moment
  if (mergeWrap) {
    while (mergeWrap.firstChild) {
      mergeWrap.removeChild(mergeWrap.firstChild);
    }

    const showMerge = CONFIG.features?.mergeMoment !== false && result.repeats && result.repeats.length > 0;
    if (showMerge) {
      const topRepeat = result.repeats[0];
      const format = options.format || CONFIG.defaultFormat;
      const formattedValue = formatItem(topRepeat, format);
      const totalTimes = topRepeat.removed + 1;

      const box = document.createElement("div");
      box.className = "merge-moment-box";

      const title = document.createElement("div");
      title.className = "merge-moment-title";
      title.textContent = COPY.result.mergeTitle;
      box.appendChild(title);

      const stage = document.createElement("div");
      stage.className = "merge-chips-stage";

      const seenVariants = topRepeat.seenAs && topRepeat.seenAs.length > 0
        ? topRepeat.seenAs
        : [topRepeat.raw || topRepeat.value];

      if (prefersReducedMotion()) {
        // Static under reduced motion
        const mergedChip = document.createElement("div");
        mergedChip.className = "chip chip-merged";
        mergedChip.textContent = formattedValue;

        const badge = document.createElement("span");
        badge.className = "merge-badge";
        badge.textContent = t("result.mergeTimes", { count: fmt(totalTimes) });
        mergedChip.appendChild(badge);

        stage.appendChild(mergedChip);
      } else {
        // Render variant chips that slide together
        for (const variant of seenVariants) {
          const chip = document.createElement("span");
          chip.className = "chip chip-source";
          chip.textContent = variant;
          stage.appendChild(chip);
        }

        // Trigger merge animation sequence
        setTimeout(() => {
          stage.classList.add("merging");

          setTimeout(() => {
            while (stage.firstChild) {
              stage.removeChild(stage.firstChild);
            }

            const mergedChip = document.createElement("div");
            mergedChip.className = "chip chip-merged pop";
            mergedChip.textContent = formattedValue;

            const badge = document.createElement("span");
            badge.className = "merge-badge pop";
            badge.textContent = t("result.mergeTimes", { count: fmt(totalTimes) });
            mergedChip.appendChild(badge);

            stage.appendChild(mergedChip);
          }, 350);
        }, 300);
      }

      box.appendChild(stage);
      mergeWrap.appendChild(box);
    }
  }

  // 6. Skipped text note
  if (skippedEl) {
    if (result.counts.skippedText > 0) {
      skippedEl.textContent = t("result.skipped", { count: fmt(result.counts.skippedText) });
      skippedEl.style.display = "block";
    } else {
      skippedEl.style.display = "none";
    }
  }

  // 7. Truncated note
  if (truncatedEl) {
    if (result.truncated) {
      truncatedEl.textContent = t("input.truncated", { max: fmt(MAX_ENTRIES) });
      truncatedEl.style.display = "block";
    } else {
      truncatedEl.style.display = "none";
    }
  }
}
