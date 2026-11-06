// LOCKED. Do not edit. List cleaning only: no DOM, no network, no storage.
// Pasted text lives only in local variables while cleanList() runs and in the result it returns.

export const MAX_CHARS = 4000000;
export const MAX_ENTRIES = 100000;
export const PHONE_FORMATS = ["e164", "plain", "wa", "spaced"];
export const REASON_CODES = ["short", "long", "landline", "pattern", "excel", "email", "nocontact"];

const MAX_TOKEN = 320;
const MAX_RAW = 80;
const MIN_PHONE_DIGITS = 7;

const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;
const ODD_SPACE = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;
const ODD_DASH = /[\u2010-\u2015\u2212]/g;
const COMMA_DOMAIN = /@([a-z0-9-]{1,63}),(com|in|net|org|co|edu)\b/gi;
const EXCEL_DECIMAL = /(\d{10,13})\.0+(?!\d)/g;
const EXCEL_SHORT = /^['"]?\d(?:\.\d+)?[eE]\+?\d{1,2}['"]?$/;
const SPLIT = /[\r\n\t,;|]+/;
const EMAIL_PART = /[^\s<>()[\]"'`:=,;]*@[^\s<>()[\]"'`:=,;/]*/g;
const PHONE_RUN = /\+?\(?\d[\d\s().-]*\d/g;
const LOCAL_OK = /^[a-z0-9][a-z0-9._%+-]*$/;
const LABEL_OK = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const TYPOS = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com", "gmal.com": "gmail.com",
  "gnail.com": "gmail.com", "gmil.com": "gmail.com", "gmaill.com": "gmail.com", "gmail.con": "gmail.com",
  "gmail.co": "gmail.com", "gmail.cm": "gmail.com", "gmail.om": "gmail.com", "gmail.comm": "gmail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yhoo.com": "yahoo.com", "yahoo.con": "yahoo.com",
  "yahoo.cm": "yahoo.com", "hotmal.com": "hotmail.com", "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com", "outlok.com": "outlook.com", "outloook.com": "outlook.com", "outlook.con": "outlook.com",
  "redifmail.com": "rediffmail.com", "rediffmai.com": "rediffmail.com", "rediffmail.con": "rediffmail.com",
  "iclould.com": "icloud.com", "icloud.con": "icloud.com"
};

const fail = (reason) => ({ ok: false, reason });

// Indian grouping by hand, so every browser shows the same text.
export function fmt(n) {
  const s = String(Math.trunc(n));
  if (s.length <= 3) return s;
  return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + s.slice(-3);
}

function isPatterned(t) {
  let same = true, up = true, down = true;
  for (let i = 1; i < t.length; i++) {
    const d = t.charCodeAt(i) - t.charCodeAt(i - 1);
    if (d !== 0) same = false;
    if (d !== 1 && d !== -9) up = false;
    if (d !== -1 && d !== 9) down = false;
  }
  return same || up || down;
}

function mobile(national) {
  if (!/^[6-9]\d{9}$/.test(national)) return fail("landline");
  if (isPatterned(national.slice(1))) return fail("pattern");
  return { ok: true, national, e164: "+91" + national };
}

// Turns any way of writing a number into one standard form, or says why it can't.
function classify(text) {
  const t = text.trim();
  let d = t.replace(/\D/g, "");
  let plus = t.startsWith("+");
  if (!plus && d.startsWith("00") && d.length >= 10) { plus = true; d = d.slice(2); }
  if (plus) {
    if (d.startsWith("91")) {
      let n = d.slice(2);
      if (n.length === 11 && n[0] === "0") n = n.slice(1);
      if (n.length < 10) return fail("short");
      if (n.length > 10) return fail("long");
      return mobile(n);
    }
    if (d.length < 8) return fail("short");
    if (d.length > 15) return fail("long");
    return { ok: true, national: null, e164: "+" + d };
  }
  if (d.length === 10) return mobile(d);
  if (d.length === 11 && d[0] === "0") return mobile(d.slice(1));
  if (d.length === 12 && d.startsWith("91")) return mobile(d.slice(2));
  if (d.length === 13 && d.startsWith("091")) return mobile(d.slice(3));
  return fail(d.length < 10 ? "short" : "long");
}

function cleanEmail(candidate, gmailRule) {
  const e = candidate.toLowerCase().replace(/^[.!?-]+|[.!?]+$/g, "");
  const at = e.indexOf("@");
  if (at < 1 || at !== e.lastIndexOf("@")) return fail("email");
  const local = e.slice(0, at);
  const rawDomain = e.slice(at + 1);
  const domain = TYPOS[rawDomain] ?? rawDomain;
  if (!LOCAL_OK.test(local) || local.includes("..") || local.endsWith(".")) return fail("email");
  const labels = domain.split(".");
  if (labels.length < 2 || !labels.every((l) => LABEL_OK.test(l))) return fail("email");
  if (!/^[a-z]{2,24}$/.test(labels[labels.length - 1])) return fail("email");
  // Gmail ignores dots and anything after a plus, so these all reach one inbox.
  const gmail = gmailRule && (domain === "gmail.com" || domain === "googlemail.com");
  const key = gmail ? local.split("+")[0].replace(/\./g, "") + "@gmail.com" : local + "@" + domain;
  return { ok: true, value: local + "@" + domain, key, typo: domain !== rawDomain };
}

const shortRaw = (s) => (s.length > MAX_RAW ? s.slice(0, MAX_RAW) + "..." : s);
const digitCount = (s) => s.replace(/\D/g, "").length;

// Stable merge sort written out by hand, so students can read it and the count is the same in every browser.
function mergeSort(items) {
  let comparisons = 0;
  const before = (a, b) => {
    comparisons++;
    if (a.type !== b.type) return a.type === "phone";
    return a.value <= b.value;
  };
  let from = items.slice();
  let to = new Array(items.length);
  for (let size = 1; size < from.length; size *= 2) {
    for (let lo = 0; lo < from.length; lo += size * 2) {
      const mid = Math.min(lo + size, from.length);
      const hi = Math.min(lo + size * 2, from.length);
      let i = lo, j = mid, k = lo;
      while (i < mid && j < hi) to[k++] = before(from[i], from[j]) ? from[i++] : from[j++];
      while (i < mid) to[k++] = from[i++];
      while (j < hi) to[k++] = from[j++];
    }
    [from, to] = [to, from];
  }
  return { sorted: from, comparisons };
}

// The one function the website uses. Every number on screen comes from here.
export function cleanList(text, { gmailRule = true } = {}) {
  const source = String(text ?? "");
  if (!source.trim()) return { empty: true };

  let truncated = source.length > MAX_CHARS;
  const tidy = source.slice(0, MAX_CHARS)
    .replace(INVISIBLE, "")
    .replace(ODD_SPACE, " ")
    .replace(ODD_DASH, "-")
    .replace(COMMA_DOMAIN, "@$1.$2")
    .replace(EXCEL_DECIMAL, "$1");

  const seen = new Map(); // The hash set. Standard form on the left, the kept entry on the right.
  const kept = [];
  const invalid = [];
  let entries = 0, duplicates = 0, skippedText = 0, lookups = 0;

  // Past the limit, entries are refused and the result says it was cut short.
  let capped = false;
  const refuse = () => { if (entries < MAX_ENTRIES) return false; capped = true; return true; };
  const addBad = (raw, reason) => { if (refuse()) return; entries++; invalid.push({ raw: shortRaw(raw.trim()), reason }); };

  const addGood = (fields, candidate, segment, fixed) => {
    if (refuse()) return;
    entries++;
    lookups++;
    const had = seen.get(fields.key);
    if (had) {
      had.removed++;
      duplicates++;
      const raw = shortRaw(candidate);
      if (had.seenAs.length < 3 && !had.seenAs.includes(raw)) had.seenAs.push(raw);
      return;
    }
    const item = { ...fields, raw: shortRaw(segment.length <= MAX_RAW ? segment : candidate), fixed, removed: 0, seenAs: [] };
    seen.set(fields.key, item);
    kept.push(item);
  };

  const addPhone = (c, run, segment) => {
    const national = c.national;
    const known = [c.e164];
    if (national) known.push(national, "91" + national, `+91 ${national.slice(0, 5)} ${national.slice(5)}`);
    const fixed = !known.includes(run) || segment !== run;
    addGood({ type: "phone", key: c.e164, value: c.e164, national, typo: false }, run, segment, fixed);
  };

  const readRun = (run, segment) => {
    const direct = classify(run);
    if (direct.ok) return addPhone(direct, run, segment);
    const parts = run.split(/\s+/);
    if (parts.length === 1) {
      const d = run.replace(/\D/g, "");
      if (d.length >= 20 && d.length % 10 === 0) {
        const chunks = d.match(/\d{10}/g);
        const results = chunks.map(classify);
        if (results.every((r) => r.ok)) {
          results.forEach((r, i) => addPhone(r, chunks[i], segment));
          return;
        }
      }
      return addBad(run, direct.reason);
    }
    // Several numbers on one line, split only by spaces.
    let buf = "";
    // Digits left over after the valid numbers are never dropped silently.
    const flush = () => {
      if (buf && digitCount(buf) > 0) addBad(buf, classify(buf).reason);
      buf = "";
    };
    for (const part of parts) {
      const alone = classify(part);
      if (alone.ok) { flush(); addPhone(alone, part, segment); continue; }
      buf = buf ? `${buf} ${part}` : part;
      const r = classify(buf);
      if (r.ok) { addPhone(r, buf, segment); buf = ""; continue; }
      const n = digitCount(buf);
      if (n >= 13 || (n >= 10 && (r.reason === "pattern" || r.reason === "landline"))) {
        addBad(buf, r.reason);
        buf = "";
      }
    }
    flush();
  };

  const readSegment = (rawSegment) => {
    const segment = rawSegment.trim();
    if (!segment) return;
    if (!/[\d@]/.test(segment)) { skippedText++; return; }
    const start = entries;
    const joined = segment.includes("@") ? segment.replace(/(\S)\s*@\s*(?=[A-Za-z])/g, "$1@") : segment;
    const others = [];
    for (const token of joined.split(/\s+/)) {
      if (EXCEL_SHORT.test(token)) { addBad(token.replace(/['"]/g, ""), "excel"); continue; }
      if (!token.includes("@")) { others.push(token); continue; }
      if (token.length > MAX_TOKEN) { addBad(token, "email"); continue; }
      const left = token.replace(EMAIL_PART, (part) => {
        const c = cleanEmail(part, gmailRule);
        if (c.ok) addGood({ type: "email", key: c.key, value: c.value, national: null, typo: c.typo }, part, joined, joined !== c.value);
        else addBad(part, "email");
        return " ";
      });
      if (left.trim()) others.push(left.trim());
    }
    const rest = others.join(" ");
    for (const m of rest.matchAll(PHONE_RUN)) {
      if (capped) break;
      const run = m[0].trim();
      if (digitCount(run) >= MIN_PHONE_DIGITS) readRun(run, segment);
    }
    if (entries === start && !capped) {
      const onlyNumber = /^[\d\s().+-]+$/.test(segment);
      addBad(segment, onlyNumber ? "short" : "nocontact");
    }
  };

  for (const segment of tidy.split(SPLIT)) {
    if (capped) break;
    readSegment(segment);
  }

  truncated = truncated || capped;
  const { sorted, comparisons } = mergeSort(kept);
  const repeats = mergeRepeats(kept);
  const fixes = kept.filter((x) => x.fixed);
  const phones = kept.filter((x) => x.type === "phone").length;

  const headline = entries === 0
    ? "No phone numbers or emails found."
    : `${fmt(entries)} ${entries === 1 ? "entry" : "entries"}, ` +
      (duplicates === 0 ? "no duplicates found." : `${fmt(duplicates)} ${duplicates === 1 ? "duplicate" : "duplicates"} removed.`);

  return {
    empty: false,
    truncated,
    headline,
    counts: {
      total: entries,
      kept: kept.length,
      phones,
      emails: kept.length - phones,
      duplicates,
      fixed: fixes.length,
      invalid: invalid.length,
      skippedText
    },
    kept,
    sorted,
    repeats,
    fixes,
    invalid,
    dsa: { lookups, pairs: (lookups * (lookups - 1)) / 2, sortComparisons: comparisons }
  };
}

// Entries that repeated, most repeated first.
function mergeRepeats(kept) {
  return kept
    .filter((x) => x.removed > 0)
    .map((x, i) => [x, i])
    .sort((a, b) => b[0].removed - a[0].removed || a[1] - b[1])
    .map((pair) => pair[0]);
}

// The only place a phone number is turned into display text.
export function formatItem(item, format = "e164") {
  if (item.type === "email") return item.value;
  if (!item.national) return format === "wa" ? item.value.slice(1) : item.value;
  const n = item.national;
  if (format === "plain") return n;
  if (format === "wa") return "91" + n;
  if (format === "spaced") return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
  return "+91" + n;
}

export function pick(result, { order = "sorted", filter = "all" } = {}) {
  const list = order === "sorted" ? result.sorted : result.kept;
  if (filter === "phones") return list.filter((x) => x.type === "phone");
  if (filter === "emails") return list.filter((x) => x.type === "email");
  return list;
}

export function toText(result, { format = "e164", order = "sorted", filter = "all", separator = "lines" } = {}) {
  return pick(result, { order, filter }).map((x) => formatItem(x, format)).join(separator === "commas" ? ", " : "\n");
}

// Kept values are validated: only digits, a plus, spaces or a checked email address.
export function toCsv(result, { format = "e164", order = "sorted", filter = "all" } = {}) {
  const rows = pick(result, { order, filter }).map((x) => `${x.type},${formatItem(x, format)}`);
  return ["type,contact", ...rows].join("\r\n") + "\r\n";
}
