// Motion utilities: loader, scan line, count-up, reduced motion check
import { getIntroSeen, setIntroSeen } from "./store.js";
import { CONFIG } from "../config.js";

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
