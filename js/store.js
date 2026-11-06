// Safe storage helper with try/catch wrapping
// Allowed localStorage keys: "lc-theme", "lc-format"
// Allowed sessionStorage keys: "lc-intro-seen"

export function getTheme() {
  try {
    return localStorage.getItem("lc-theme");
  } catch (e) {
    return null;
  }
}

export function setTheme(value) {
  try {
    localStorage.setItem("lc-theme", value);
  } catch (e) {}
}

export function getFormat() {
  try {
    return localStorage.getItem("lc-format");
  } catch (e) {
    return null;
  }
}

export function setFormat(value) {
  try {
    localStorage.setItem("lc-format", value);
  } catch (e) {}
}

export function getIntroSeen() {
  try {
    return sessionStorage.getItem("lc-intro-seen") === "1";
  } catch (e) {
    return true;
  }
}

export function setIntroSeen() {
  try {
    sessionStorage.setItem("lc-intro-seen", "1");
  } catch (e) {}
}
