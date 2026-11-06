// Sets theme and intro class before first paint to prevent flash
(function() {
  try {
    var savedTheme = localStorage.getItem("lc-theme");
    var theme = savedTheme;
    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    // Storage blocked; fallback to light default
    document.documentElement.setAttribute("data-theme", "light");
  }

  try {
    var introSeen = sessionStorage.getItem("lc-intro-seen");
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (introSeen === "1" || prefersReduced) {
      document.documentElement.classList.add("intro-seen");
    }
  } catch (e) {
    document.documentElement.classList.add("intro-seen");
  }
})();
