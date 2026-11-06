// Motion utilities: loader, scan line, count-up, reduced motion check
import { getIntroSeen, setIntroSeen } from "./store.js";
import { CONFIG } from "../config.js";
import { fmt } from "./engine/cleaner.js";

let activeCountUps = [];
let activeScanTimeout = null;

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function cancelRunningAnimations() {
  if (activeScanTimeout) {
    clearTimeout(activeScanTimeout);
    activeScanTimeout = null;
  }
  for (const id of activeCountUps) {
    cancelAnimationFrame(id);
  }
  activeCountUps = [];
}

export function initLoader(onComplete) {
  const loaderEl = document.getElementById("app-loader");
  if (!loaderEl) {
    if (onComplete) onComplete();
    return;
  }

  if (getIntroSeen() || prefersReducedMotion()) {
    loaderEl.style.display = "none";
    document.documentElement.classList.add("intro-seen");
    if (onComplete) onComplete();
    return;
  }

  const duration = Math.min(CONFIG.loaderMs || 800, 800);

  setTimeout(() => {
    loaderEl.classList.add("fade-out");
    setTimeout(() => {
      loaderEl.style.display = "none";
      document.documentElement.classList.add("intro-seen");
      document.body.classList.add("hero-animated");
      setIntroSeen();
      if (onComplete) onComplete();
    }, 250);
  }, duration);
}

export function triggerScan(onFinish) {
  cancelRunningAnimations();

  if (prefersReducedMotion()) {
    if (onFinish) onFinish();
    return;
  }

  const scanLine = document.getElementById("scan-line");
  const btnClean = document.getElementById("btn-clean");
  const btnMobile = document.getElementById("btn-clean-mobile");

  if (scanLine) {
    scanLine.classList.remove("scanning");
    // Trigger reflow to restart animation
    void scanLine.offsetWidth;
    scanLine.classList.add("scanning");
  }

  if (btnClean) btnClean.classList.add("shine");
  if (btnMobile) btnMobile.classList.add("shine");

  const scanDuration = Math.min(CONFIG.scanMs || 450, 450);

  activeScanTimeout = setTimeout(() => {
    if (scanLine) scanLine.classList.remove("scanning");
    if (btnClean) btnClean.classList.remove("shine");
    if (btnMobile) btnMobile.classList.remove("shine");
    activeScanTimeout = null;
    if (onFinish) onFinish();
  }, scanDuration);
}

// Ease out cubic
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function countUpHeadline(element, headlineText, durationMs, onFinish) {
  if (!element) return;

  if (prefersReducedMotion() || !durationMs || durationMs <= 0) {
    element.textContent = headlineText;
    if (onFinish) onFinish();
    return;
  }

  // Find all numbers in the headline
  const numberMatches = [...headlineText.matchAll(/\b[\d,]+\b/g)];
  if (numberMatches.length === 0) {
    element.textContent = headlineText;
    if (onFinish) onFinish();
    return;
  }

  const targets = numberMatches.map(m => ({
    raw: m[0],
    val: parseInt(m[0].replace(/,/g, ""), 10),
    index: m.index
  }));

  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const eased = easeOutCubic(progress);

    if (progress >= 1) {
      // Must end with exact headline
      element.textContent = headlineText;
      if (onFinish) onFinish();
      return;
    }

    // Reconstruct headline with current interpolated values
    let output = "";
    let lastIdx = 0;
    for (const item of targets) {
      output += headlineText.slice(lastIdx, item.index);
      const curVal = Math.round(item.val * eased);
      output += fmt(curVal);
      lastIdx = item.index + item.raw.length;
    }
    output += headlineText.slice(lastIdx);
    element.textContent = output;

    const animId = requestAnimationFrame(tick);
    activeCountUps.push(animId);
  }

  const firstId = requestAnimationFrame(tick);
  activeCountUps.push(firstId);
}

export function countUpNumber(element, targetVal, durationMs) {
  if (!element) return;

  if (prefersReducedMotion() || !durationMs || durationMs <= 0) {
    element.textContent = fmt(targetVal);
    return;
  }

  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const eased = easeOutCubic(progress);

    if (progress >= 1) {
      element.textContent = fmt(targetVal);
      return;
    }

    const cur = Math.round(targetVal * eased);
    element.textContent = fmt(cur);

    const animId = requestAnimationFrame(tick);
    activeCountUps.push(animId);
  }

  const id = requestAnimationFrame(tick);
  activeCountUps.push(id);
}
