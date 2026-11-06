// LOCKED. Run with: node tools/verify.mjs
// Must end with RESULT: ALL PASS at the start of every phase and before deploy.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const E = await import("../js/engine/cleaner.js");
const { cleanList, formatItem, toText, toCsv, fmt, MAX_ENTRIES, REASON_CODES, PHONE_FORMATS } = E;
const { SAMPLE_TEXT } = await import("../js/sample-data.js");
const { CONFIG } = await import("../config.js");
const { COPY, t } = await import("../js/copy.js");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let fails = 0, passes = 0;
const check = (ok, name) => {
  if (ok) passes++;
  else { fails++; console.log("FAIL  " + name); }
};
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// 1. Locked files have not changed. Line endings are ignored so Windows is fine.
const HASHES = {
  "js/engine/cleaner.js": "09832951ae56df6626696e09543b077deae2517e7aea532c0316c3279aed19ed",
  "js/sample-data.js": "e50c2ef30a4985926a66568c1af553b68af6c57bcafd106579812aec09c7668f",
  "vercel.json": "ba4d7641ff1671722cefdaea29f7ce12d5341129eb068f2b324259f5e03cca85"
};
for (const [file, hash] of Object.entries(HASHES)) {
  check(sha(read(file).replace(/\r/g, "")) === hash, `Locked file was changed: ${file}`);
}

// 2. The sample: the exact numbers the site and the reel show.
const S = cleanList(SAMPLE_TEXT);
check(S.headline === "1,240 entries, 312 duplicates removed.", `sample headline is "${S.headline}"`);
check(same(S.counts, { total: 1240, kept: 887, phones: 640, emails: 247, duplicates: 312, fixed: 400, invalid: 41, skippedText: 352 }), `sample counts: ${JSON.stringify(S.counts)}`);
check(same(S.dsa, { lookups: 1199, pairs: 718201, sortComparisons: 7602 }), `sample DSA numbers: ${JSON.stringify(S.dsa)}`);
const byReason = {};
for (const x of S.invalid) byReason[x.reason] = (byReason[x.reason] || 0) + 1;
check(same(Object.entries(byReason).sort(), Object.entries({ excel: 6, landline: 8, short: 9, long: 5, pattern: 4, email: 9 }).sort()), `sample reasons: ${JSON.stringify(byReason)}`);
check(sha(S.kept.map((k) => k.key).sort().join("\n")) === "61e6b3ace929011021c59f8e6ac86bf6a8cba03f2eaa0d402dd9982d68487e1a", "sample keys match the independent answer key");
check(sha(toText(S)) === "3b71eb277a9660841c9e3182818904159c422479bdedcd7d53c06f7d4f6c23d3", "sample clean list text");
check(S.repeats.length > 0 && S.repeats[0].removed === 3, "sample has a most-repeated contact");
check(cleanList(SAMPLE_TEXT, { gmailRule: false }).headline === "1,240 entries, 305 duplicates removed.", "Gmail rule off");

// 3. Exact cases. [input, kept values, invalid reasons]
const CASES = [
  ["+91 98400 12345", ["+919840012345"], []],
  ["098400-12345", ["+919840012345"], []],
  ["(984) 001-2345", ["+919840012345"], []],
  ["919840012345", ["+919840012345"], []],
  ["9840012345.0", ["+919840012345"], []],
  ["0091 98400 12345", ["+919840012345"], []],
  ["+91 098400 12345", ["+919840012345"], []],
  ["98400​12345", ["+919840012345"], []],
  ["98400–12345", ["+919840012345"], []],
  ["+1 (415) 555-0123", ["+14155550123"], []],
  ["98400 12346 98400 12347", ["+919840012346", "+919840012347"], []],
  ["98400123469840012347", ["+919840012346", "+919840012347"], []],
  ["Call 9840012346 or 9840012347", ["+919840012346", "+919840012347"], []],
  ["90251 74730 8", ["+919025174730"], ["short"]],
  ["9.84E+09", [], ["excel"]],
  ["044 2345 6789", [], ["landline"]],
  ["1234567890", [], ["landline"]],
  ["9999999999", [], ["pattern"]],
  ["9876543210", [], ["pattern"]],
  ["98400 123", [], ["short"]],
  ["98401234567", [], ["long"]],
  ["Rahul.K@Gmail.com", ["rahul.k@gmail.com"], []],
  ["r@gmial.com", ["r@gmail.com"], []],
  ["rahul@gmail,com", ["rahul@gmail.com"], []],
  ["anu @ yahoo.co.in", ["anu@yahoo.co.in"], []],
  ["\"Karthik\" <karthik.s@example.com>", ["karthik.s@example.com"], []],
  ["mailto:KARTHIK.S@example.com;", ["karthik.s@example.com"], []],
  ["Priya, 9840012345, priya@example.com.", ["+919840012345", "priya@example.com"], []],
  ["bad@@mail", [], ["email"]],
  ["test@domain", [], ["email"]],
  ["Order 4521", [], ["nocontact"]]
];
for (const [input, kept, reasons] of CASES) {
  const r = cleanList(input);
  check(same(r.kept.map((k) => k.value), kept), `${input}: kept ${JSON.stringify(r.kept.map((k) => k.value))}`);
  check(same(r.invalid.map((k) => k.reason), reasons), `${input}: invalid ${JSON.stringify(r.invalid.map((k) => k.reason))}`);
}
check(cleanList("Name,Phone,Email").headline === "No phone numbers or emails found.", "text only headline");
check(cleanList("Name,Phone,Email").counts.skippedText === 3, "text only skipped count");
check(cleanList("   \n\t ").empty === true, "empty input");
check(cleanList("9840012345").headline === "1 entry, no duplicates found.", "one entry wording");
check(cleanList("9840012345\n9840012345").headline === "2 entries, 1 duplicate removed.", "one duplicate wording");
check(cleanList("+91 98400 12345\n09840012345\n9840012345").headline === "3 entries, 2 duplicates removed.", "phone duplicates");
check(cleanList("rahul.k@gmail.com\nrahulk@gmail.com\nrahul.k+x@gmail.com").counts.kept === 1, "Gmail dots and plus");
check(cleanList("rahul.k@gmail.com\nrahulk@gmail.com\nrahul.k+x@gmail.com", { gmailRule: false }).counts.kept === 3, "Gmail rule off keeps all");
check(cleanList("ravi.k@example.com\nravik@example.com").counts.kept === 2, "dots matter outside Gmail");
check(cleanList("9840012345\nrahul@example.com\n9840012345").kept[0].removed === 1, "removed count");

// 4. Formats, order, CSV.
const one = cleanList("9840012345\nrahul@example.com\n+1 415 555 0123");
const p = one.kept[0], intl = one.kept[2];
check(same(PHONE_FORMATS.map((f) => formatItem(p, f)), ["+919840012345", "9840012345", "919840012345", "+91 98400 12345"]), "phone formats");
check(formatItem(intl, "wa") === "14155550123" && formatItem(intl, "plain") === "+14155550123", "international formats");
check(formatItem(one.kept[1], "plain") === "rahul@example.com", "emails ignore the phone format");
check(toText(one) === "+14155550123\n+919840012345\nrahul@example.com", "sorted text");
check(toText(one, { order: "asPasted" }) === "+919840012345\nrahul@example.com\n+14155550123", "as pasted text");
check(toText(one, { filter: "emails" }) === "rahul@example.com", "emails filter");
check(toText(one, { filter: "phones", format: "plain", separator: "commas" }) === "+14155550123, 9840012345", "phones, plain, commas");
check(toCsv(one) === "type,contact\r\nphone,+14155550123\r\nphone,+919840012345\r\nemail,rahul@example.com\r\n", "CSV");
for (const f of PHONE_FORMATS) check(!!COPY.output.formats[f] && !!COPY.output.formatNotes[f], `copy for format ${f}`);
check(PHONE_FORMATS.includes(CONFIG.defaultFormat), "config default format");
check(fmt(1240) === "1,240" && fmt(100000) === "1,00,000" && fmt(718201) === "7,18,201" && fmt(7) === "7", "Indian number grouping");

// 5. 3,000 random messy inputs: nothing breaks and every number adds up.
const PIECES = ["9840012345", "+91 ", "0", "91", " ", "\n", ",", "-", "(", ")", ".", "@", "gmail.com", "example.com", "Rahul", "x", "9", "7", "\t", ";", "E+09", " ", "​", "தமிழ்", "\u{1F600}", "<", ">", "\"", "1"];
let seed = 42;
const rnd = (n) => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n;
const SAFE_CSV = /^(phone,\+?\d[\d ]*|email,[a-z0-9][a-z0-9._%+-]*@[a-z0-9.-]+)$/;
for (let i = 0; i < 3000; i++) {
  let s = "";
  for (let k = 1 + rnd(40); k > 0; k--) s += PIECES[rnd(PIECES.length)];
  const r = cleanList(s);
  if (r.empty) continue;
  const c = r.counts;
  check(c.total === c.kept + c.duplicates + c.invalid, `counts add up: ${JSON.stringify(s)}`);
  check(c.kept === c.phones + c.emails && c.kept === r.kept.length && c.invalid === r.invalid.length, `lists match counts: ${JSON.stringify(s)}`);
  check(new Set(r.kept.map((k) => k.key)).size === r.kept.length, `no duplicate keys: ${JSON.stringify(s)}`);
  check(r.kept.reduce((n, k) => n + k.removed, 0) === c.duplicates, `removed adds up: ${JSON.stringify(s)}`);
  check(r.sorted.length === r.kept.length && r.sorted.every((x, j) => j === 0 || (r.sorted[j - 1].type === x.type ? r.sorted[j - 1].value <= x.value : x.type === "email")), `sorted: ${JSON.stringify(s)}`);
  for (const k of r.kept) {
    if (k.type === "phone") check(/^\+91[6-9]\d{9}$/.test(k.value) || (/^\+\d{8,15}$/.test(k.value) && !k.value.startsWith("+91")), `phone shape ${k.value}`);
  }
  check(toCsv(r).split("\r\n").slice(1, -1).every((row) => SAFE_CSV.test(row)), `CSV is safe: ${JSON.stringify(s)}`);
  check(r.invalid.every((x) => REASON_CODES.includes(x.reason) && x.raw.length <= 83), `invalid entries are labelled: ${JSON.stringify(s)}`);
}

// 6. Size limits.
const many = Array.from({ length: MAX_ENTRIES }, (_, i) => `u${i}@example.com`).join("\n") + "\n";
check(cleanList(many).truncated === false && cleanList(many).counts.total === MAX_ENTRIES, "exactly the limit is not cut short");
check(cleanList(many + "x@example.com").truncated === true, "over the limit is cut short");
check(cleanList("9840012345 ".repeat(400000)).counts.total === MAX_ENTRIES, "one huge line stops at the limit");

// 7. Copy has every reason and fills values.
for (const code of REASON_CODES) check(!!COPY.reasons[code]?.title && !!COPY.reasons[code]?.detail, `reason copy: ${code}`);
check(t("input.lines", { lines: "12" }) === "12 lines", "t() fills values");

// 8. Privacy and writing rules across everything built so far.
const SKIP_DIRS = new Set(["node_modules", ".git", ".vercel", "tools"]);
const walk = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
  const path = dir ? `${dir}/${e.name}` : e.name;
  if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path);
  return /\.(js|html|css|md|json)$/.test(e.name) ? [path] : [];
});
const files = walk("");
const NEVER = [
  ["XMLHttpRequest", /XMLHttpRequest/], ["sendBeacon", /sendBeacon/], ["WebSocket", /WebSocket/],
  ["EventSource", /EventSource/], ["innerHTML", /innerHTML|outerHTML|insertAdjacentHTML/],
  ["document.write", /document\.write/], ["eval", /\beval\(|new Function\(/],
  ["console output", /console\.\w+\(/], ["analytics", /googletagmanager|gtag\(|fbq\(|connect\.facebook|clarity\.ms|hotjar/i],
  ["outside file", /<(script|link)[^>]+(src|href)=["']https?:/i], ["web font", /fonts\.googleapis|@import\s+url\(["']?http/i]
];
const STORAGE_FILES = new Set(["js/store.js", "js/theme-init.js", "js/selftest.js"]);
for (const file of files) {
  const body = read(file);
  if (/\.(js|html|css)$/.test(file)) {
    for (const [name, re] of NEVER) check(!re.test(body), `${file}: ${name} is not allowed`);
    if (file !== "js/selftest.js") check(!/\bfetch\(/.test(body), `${file}: fetch is not allowed`);
    if (!STORAGE_FILES.has(file)) check(!/localStorage|sessionStorage|indexedDB/.test(body), `${file}: storage is only allowed in js/store.js`);
  }
  check(!/[‒-―]/.test(body), `${file}: long dash found`);
  if (!file.endsWith(".md")) check(!/(?![©®™])\p{Extended_Pictographic}/u.test(body), `${file}: emoji found`);
}
for (const file of ["js/store.js", "js/theme-init.js"]) {
  if (!existsSync(join(ROOT, file))) continue;
  const keys = [...read(file).matchAll(/["'`](lc-[\w-]+)["'`]/g)].map((m) => m[1]);
  check(keys.every((k) => ["lc-theme", "lc-format", "lc-intro-seen"].includes(k)), `${file} keys: ${keys}`);
}
const CSP = JSON.parse(read("vercel.json")).headers[0].headers.find((h) => h.key === "Content-Security-Policy").value;
check(CSP.includes("connect-src 'none'") && CSP.includes("script-src 'self'") && CSP.includes("form-action 'none'"), "vercel.json lock");
if (existsSync(join(ROOT, "index.html"))) {
  const html = read("index.html");
  check(/<meta[^>]+Content-Security-Policy[^>]+connect-src 'none'/i.test(html), "index.html: CSP meta tag missing");
  check(!/<form\b/i.test(html), "index.html: no form tag allowed");
  check(!/\sstyle=/i.test(html), "index.html: inline style attribute is blocked by the lock");
  check(!/\son[a-z]+=/i.test(html), "index.html: inline event handler is blocked by the lock");
  check(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), "index.html: inline script is blocked by the lock");
  check(!/<style\b/i.test(html), "index.html: style tag is blocked by the lock");
  const box = html.match(/<textarea[^>]+id=["']list["'][^>]*>/i)?.[0] ?? "";
  check(!!box, "index.html: needs <textarea id=\"list\">");
  for (const need of ['autocomplete="off"', 'spellcheck="false"', 'autocapitalize="off"', 'autocorrect="off"']) {
    check(box.includes(need), `index.html: #list needs ${need}`);
  }
  check(!/\bname=/.test(box), "index.html: #list must have no name");
}

console.log(`${passes} checks passed, ${fails} failed (${files.length} files scanned)`);
console.log(fails ? "RESULT: FAILED" : "RESULT: ALL PASS");
process.exit(fails ? 1 : 0);
