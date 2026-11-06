# List Cleaner: Project Brief

## 1. What we are building

A polished Wrench Wise website for PC and mobile. A visitor pastes a messy list of phone numbers or emails. The site removes duplicates, fixes formats and shows the count, for example "1,240 entries, 312 duplicates removed." They can copy the clean list or download it. Nothing pasted ever leaves the device.

**Who it is for:** students, working people and our own sales team, most of whom have never written code.

**Already done and tested for you:** the cleaning engine, a messy 1,240-entry sample, all the words on the site (`js/copy.js`) and the settings (`config.js`). Your job is everything the visitor sees and touches.

**Time target:** 1 hour in total. Keep it simple and finish it properly.

When there is a trade-off, follow this order:
1. The privacy promise is true. Nothing is stored or sent.
2. It looks professional and feels instant on a phone.
3. Every number is exactly right.
4. It stays smooth on a mid-range Android phone, even with a long list.
5. The DSA section teaches clearly.
6. The Wrench Wise CTA works in one tap.
7. It is easy to upgrade.
8. Everything else.

---

## 2. Hard rules

1. **Code.** Plain HTML, CSS and JavaScript (ES modules). No frameworks, libraries, CDNs, npm packages or web fonts. The only image files are the logo, the link preview image and app icons. Draw everything else with inline SVG and CSS.
2. **Locked files.** Never edit `js/engine/`, `js/sample-data.js`, `tools/`, `vercel.json` or `package.json`. Change `js/copy.js` and `config.js` only if I ask, except `siteUrl` in Phase 4. At the start of every phase, run `node tools/verify.mjs`. It must end with `RESULT: ALL PASS`. If you think a locked file is wrong, stop and tell me.
3. **Nothing leaves the device.** No backend, database, API calls, accounts or forms. No GA4, Meta Pixel or any other outside script, because an outside script on this page could read the pasted list. Normal links to wrench-wise.com and WhatsApp are fine.
4. **The list stays on the page.** Hold the pasted text and the results only in the text box, the results on screen and variables in `main.js`. Never put any of it in storage, the URL, the page title, a log, an error message or an `aria-live` message. Downloads are made on the device with a `Blob`. Clear the box and the results on `pagehide`.
5. **The text box.** Exactly: `<textarea id="list" autocomplete="off" spellcheck="false" autocapitalize="off" autocorrect="off" data-1p-ignore data-lpignore="true">`, with a real `<label>`. No `name` and no `<form>` around it. Its text is at least 16px so phones do not zoom in.
6. **Privacy lock.** Put this as the first tag in `<head>`, after the charset:
   `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; manifest-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'">`
   This means no inline scripts, no `<style>` tags, no `style=""` attributes and no `onclick=""` in HTML. Setting `element.style` from JavaScript is fine. Use `meta` tags for link previews, with no canonical `link` tag.
7. **One source for every number.** Every count, headline, list and DSA number on screen comes straight from `cleanList()`. Phone numbers are turned into text only by `formatItem()`. Copy text comes only from `toText()` and the CSV only from `toCsv()`. Format counts with `fmt()` from the engine. Never recount, re-sort or reformat anywhere else.
8. **Storage.** `localStorage` may hold only `lc-theme` and `lc-format` (the chosen phone format). `sessionStorage` may hold only `lc-intro-seen`. Use them only in `js/store.js` and `js/theme-init.js`, wrapped in try and catch. The site must work when storage is blocked.
9. **Tone.** Calm and helpful. Never promise a job or a result. Never use these where a user can see them: stupid, dumb, useless, guarantee, placement, salary, lakh, "get hired", "seats left", "100% accurate", "100% safe", or any countdown to buy.
10. **Words.** All text comes from `js/copy.js` through `t()`. Program names always use the full name from `config.js`. No emojis. No em dashes.
11. **Safety.** Never use `innerHTML` or `insertAdjacentHTML`. Use `textContent`. Pasted text can contain anything, so it must never become HTML. No `console` output.
12. **No overlap.** Nothing overlaps, clips or scrolls sideways at 320, 360, 390, 768, 1280 or 1440 px wide. Long emails wrap or truncate with an ellipsis, never push the layout wider.
13. **No placeholder look.** No grey boxes, lorem ipsum, stock icons or unfinished sections. Remove any debug panel before Phase 4 ends.
14. **Long lists stay smooth.** Draw at most `config.previewRows` rows on screen. Build rows in a `DocumentFragment`. Copy and download always include every row.

---

## 3. Keep it easy to upgrade

- The engine has no page code. Pages call `cleanList()`, `formatItem()`, `toText()` and `toCsv()`.
- All words are in `js/copy.js`. All settings are in `config.js`.
- Each `config.features` switch set to `false` hides that feature with no errors.
- Each section has its own file and render function. A new section means one new file and one line in `main.js`.
- Colours, spacing and timing live only in `styles/tokens.css`.

---

## 4. Tech setup and file structure

ES modules need a local server. Use `npx --yes serve .` from the project folder, or Antigravity's built-in preview. Vercel needs no build command. Set up git in Phase 1 and commit at the end of every phase.

```
list-cleaner/
  index.html
  config.js            given
  vercel.json          given, LOCKED
  package.json         given, LOCKED
  manifest.json
  og-image.png         made in Phase 4
  assets/logo.png      I add this. If missing, show "Wrench Wise" as text
  assets/icon.svg      list-with-tick icon, drawn in code
  js/
    engine/cleaner.js  LOCKED
    sample-data.js     LOCKED. The messy 1,240-entry sample
    copy.js            given
    theme-init.js      plain script in head. Sets theme and intro class before first paint
    main.js            starts everything, holds the text and the result
    store.js           safe storage
    links.js           program and WhatsApp links with UTM
    input-ui.js        text box, line count, sample, paste, open file, clear, clean
    result-ui.js       headline, count-up, stat tiles, bar, merge moment
    output-ui.js       format, filter, order, separator, preview, copy, download
    details-ui.js      Duplicates, Tidied and Need a look tabs
    sections-ui.js     privacy strip, DSA section, habits, CTA, footer
    motion.js          loader, scan line, count-up, scroll reveal, reduced motion check
    selftest.js        ?test=1
  styles/
    tokens.css  base.css  components.css  motion.css
  tools/verify.mjs     LOCKED
```

**The engine**
- `cleanList(text, { gmailRule })` returns `{ empty: true }`, or `{ headline, truncated, counts, kept, sorted, repeats, fixes, invalid, dsa }`. Pass `gmailRule: CONFIG.gmailRule`.
- `counts`: `{ total, kept, phones, emails, duplicates, fixed, invalid, skippedText }`.
- Each contact in `kept`, `sorted`, `repeats` and `fixes`: `{ type: "phone" | "email", key, value, raw, fixed, removed, seenAs }`. `removed` is how many extra times it appeared. `seenAs` holds up to 3 other ways it was written.
- Each entry in `invalid`: `{ raw, reason }`. `reason` is one of `REASON_CODES`, and its words are in `copy.reasons`.
- `dsa`: `{ lookups, pairs, sortComparisons }`.
- `formatItem(contact, format)`: `format` is one of `PHONE_FORMATS` (`e164`, `plain`, `wa`, `spaced`). Emails come back unchanged.
- `toText(result, { format, order, filter, separator })` and `toCsv(result, { format, order, filter })`. `order`: `"sorted"` or `"asPasted"`. `filter`: `"all"`, `"phones"` or `"emails"`. `separator`: `"lines"` or `"commas"`.
- `fmt(n)` gives Indian grouping, for example `1,240` and `1,00,000`.
- `MAX_ENTRIES` (100,000) and `MAX_CHARS` (4 million). The engine stops there and sets `truncated`.

---

## 5. Page layout

**Laptop (1024px and up):** centred, max width 1200px. The hero is two columns. Left: heading, then the input card (text box about 360px tall, line count, buttons). Right: the result card. Below them, the output panel at full width, then the other sections.

**Phone:** one column in this order: short heading, input card (text box about 40% of the screen height), result card, output panel. When the box has text, a sticky bottom bar holds the Clean list button. After cleaning, scroll smoothly to the result card (instantly under reduced motion).

**Order of sections:** header, hero (input and result), output panel with tabs, privacy strip, DSA section, three habits, CTA, footer.

---

## 6. Features

**A. Loader.** Shown on the first visit of a session. The logo in the centre, three short list lines that slide together into one line with a tick, and a thin brand gradient bar. It ends by `config.loaderMs` (never longer), fades in 250 ms, and the hero rises 12px into place. If JavaScript fails, a CSS animation still removes it by 2 seconds. No loader under reduced motion.

**B. Input card.**
- The text box with a live line count (`input.lines`). Add a `<noscript>` line using `noScript`.
- Buttons: Clean list (primary), Try a messy sample, Paste (`features.pasteButton`, uses `navigator.clipboard.readText()`, shows `input.pasteBlocked` if refused), Open a file (`features.fileOpen`, `.csv` and `.txt` only, read with `FileReader`, show `input.fileTooBig` above `config.maxFileMB`), and Clear.
- Clean runs on the button, on Ctrl + Enter (show `input.shortcut` as a hint on laptop), after a paste into the box, after the sample loads and after a file opens. Never on every key press.
- `privacy.line` sits under the box, with a small drawn shield.

**C. Scan moment.** On Clean, a thin brand gradient line sweeps down the text box in `config.scanMs`. Run `cleanList()` straight away. The results appear as the line finishes. Never wait longer than the scan. No scan under reduced motion.

**D. Result card.** Empty state first: a drawn SVG of a messy list turning into a neat one, with `result.empty` and `result.emptySub`. Then:
- The headline from `result.headline`, at least 40px on laptop and 28px on phone, weight 800. Its numbers count up over `config.countUpMs`. The final frame must show exactly `result.headline`.
- `result.split` with the phone and email counts.
- Four stat tiles: Clean contacts, Duplicates removed, Tidied, Need a look. Tapping a tile opens its tab in the output panel.
- A stacked bar: kept, duplicates and need a look, as parts of `counts.total`, with a label on each part so colour is never the only signal.
- `result.skipped` in small text when `counts.skippedText` is above 0.
- `input.truncated` (filled with `fmt(MAX_ENTRIES)`) when `truncated` is true.

**E. Merge moment** (`features.mergeMoment`). Under the bar, `result.mergeTitle` with `repeats[0]`: its `seenAs` versions appear as chips, slide together and fold into one chip showing `formatItem()` of the contact, with a badge `result.mergeTimes` (count is `removed + 1`). Plays once per clean. Static under reduced motion. Hidden when there are no repeats.

**F. Output panel: Clean list tab.**
- Controls: phone format (4 pills from `copy.output.formats`, with the note under the selected one, saved in `lc-format`), Show (All, Phones, Emails), Order (A to Z, As pasted) and Separate with (New lines, Commas).
- The list preview: one row per contact in a monospace font, at most `config.previewRows` rows, then `output.preview` if there are more.
- Buttons: Copy (`navigator.clipboard.writeText(toText(...))`, show `output.copyFailed` if refused), Download CSV (`clean-list.csv`) and Download TXT (`clean-list.txt`), both from a `Blob` with the current options.
- `output.excelTip` in small text near the Download CSV button.

**G. Detail tabs** (`features.detailTabs`).
- **Duplicates:** `repeats`, most repeated first: the contact, a `{count} times` badge and `details.alsoAs` with `seenAs`. Show `details.gmail` once when any repeated contact is a Gmail address and `CONFIG.gmailRule` is true.
- **Tidied:** `fixes` as Before (`raw`) and After (`formatItem()` in the chosen format) rows.
- **Need a look:** `invalid` rows: `raw`, then the reason's title and detail from `copy.reasons`.
- Each tab shows at most 200 rows, then `details.limit`. Each has its own empty message.

**H. Privacy strip.** `privacy.line`, `proofTitle`, `proof` and `advice`, with a drawn shield.

**I. DSA section** (`features.underTheHood`). Three cards: Standard form first, Hash set and Sorting. After a clean, fill `hashLive` from `dsa.lookups` and `dsa.pairs`, and `sortLive` from `dsa.sortComparisons`, all through `fmt()`.

**J. CTA.** A card with `cta.title`, `cta.body` and two buttons: the program link (`program.page`, or `website`, with UTM from `config.utm`) and WhatsApp (hidden if `salesWhatsApp` is empty). No forms or gates. Links open in a new tab with `rel="noopener noreferrer"`.

**K. Theme.** Light and dark, first visit follows the device, a toggle saves `lc-theme`.

**Nice to have, only if time allows:** `manifest.json` install support.

---

## 7. Visual style: matched to wrench-wise.com

Emerald as the main colour, teal and cyan as accents, gray text, white cards and soft emerald-to-cyan gradients. Every colour is a CSS variable in `styles/tokens.css`.

| Token | Light (default) | Dark |
|---|---|---|
| `--bg` | `#FFFFFF` | `#0F172A` |
| `--bg-grad` | `linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 45%, #ECFEFF 100%)` | `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)` |
| `--surface` | `#FFFFFF` | `#1E293B` |
| `--surface-2` | `#F3F4F6` | `#334155` |
| `--border` | `#E5E7EB` | `#334155` |
| `--text` | `#111827` | `#F1F5F9` |
| `--text-2` | `#374151` | `#CBD5E1` |
| `--muted` | `#6B7280` | `#94A3B8` |
| `--brand` | `#059669` | `#10B981` |
| `--brand-strong` | `#047857` | `#34D399` |
| `--brand-soft` | `#D1FAE5` | `rgba(16,185,129,0.15)` |
| `--accent` | `#0891B2` | `#22D3EE` |
| `--kept` | `#059669` | `#34D399` |
| `--dup` | `#0891B2` | `#22D3EE` |
| `--bad` | `#B45309` | `#FBBF24` |

**Brand gradient:** `--brand-grad: linear-gradient(90deg, #059669, #0D9488, #06B6D4)`. Use it for primary buttons, the bar under the header, the scan line and the CTA card's top edge.

**Fonts:** `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Headings weight 800, letter spacing -0.01em. The text box, list rows and chips use `ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`. Numbers use `font-variant-numeric: tabular-nums`.

**Shapes:** buttons, pills and chips 999px. Cards 16px. Text box 12px.

**Shadows** (in dark, same shapes with `rgba(0,0,0,0.40)`):
- `--shadow-sm: 0 1px 3px rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.10)`
- `--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)`
- `--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)`

**Hover effects** (only inside `@media (hover: hover)`)
- Buttons lift 2px with `--shadow-md`. The primary button also slides its gradient.
- Cards and stat tiles lift 3px with `--shadow-lg` and a soft brand border.
- Pills, chips and tabs fill with `--brand-soft`.
- List rows get a soft `--surface-2` background.
- Links get an underline that grows from the left.

**Micro-interactions**
- Press on any button, pill or chip: scale to 0.97.
- Text box focus: border glows in `--brand`. On paste, it pulses once and the line count ticks up.
- Clean button: a shine sweeps across it on click, alongside the scan line.
- Headline numbers count up. Stat tiles stagger in by 40 ms. Bar parts grow left to right with a small overshoot.
- Merge moment: chips slide together and fold into one, then the badge pops.
- Tabs: an underline slides to the active tab. Rows cross-fade when the format, filter or order changes.
- Copy: icon turns into a tick and the label changes to `output.copied` for 1.5 seconds.
- Download: the arrow drops into the tray once.
- Clear: the text box content fades out, then the result card returns to its empty state.
- Theme toggle: sun and moon rotate and swap.
- Scroll reveal: lower sections fade and rise 16px, once, with `IntersectionObserver`.

**Motion rules**
- Animate only `transform`, `opacity` and SVG `stroke-dashoffset`. Bar parts use `transform: scaleX()`.
- `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`. `--ease: cubic-bezier(0.4, 0, 0.2, 1)`. Most effects 150 to 250 ms.
- A new clean replaces any running animation.
- `prefers-reduced-motion`: no loader, scan, count-up, merge, stagger or reveal. Plain state changes only.

**Access:** full keyboard use, visible focus rings (2px `--accent`), tap targets at least 44px, text contrast at least 4.5 to 1. Tabs use `role="tablist"` with arrow keys. One polite `aria-live` region announces only `result.headline` after each clean.

**Meta:** `theme-color` `#FFFFFF` and `#0F172A` by media query. Title: "List Cleaner | Wrench Wise". Add a description and `og:` tags.

---

## 8. Words

Use `js/copy.js` as it is. The reasons, format names and notes are already written. Do not add other visible text without asking me.

---

## 9. Analytics

None, on purpose (rule 3). The UTM tags on links to wrench-wise.com show visits from this project in the main site's reports.

---

## 10. Correctness

**`node tools/verify.mjs`** checks the engine, the sample's exact numbers, the locked files and the privacy rules across all your files. It must pass at the start of every phase and before deploy.

**`?test=1`** opens a self-test page in `js/selftest.js`, listing PASS or FAIL per line:
1. The sample, run through the real page code, shows exactly "1,240 entries, 312 duplicates removed.", with tiles 887, 312, 400 and 41, and "640 phone numbers and 247 emails".
2. The DSA cards show 1,199 lookups, 7,18,201 comparisons and 7,602 sorting comparisons.
3. The merge moment shows a contact with "4 times".
4. The preview shows 500 rows and the line "Showing the first 500 of 887."
5. `toCsv()` with the default options has 888 lines plus a final line break.
6. After cleaning the sample, no phone number or email from it appears in `localStorage`, `sessionStorage`, `location.href`, `document.title` or the `aria-live` region.
7. `fetch("https://wrench-wise.com/", { mode: "no-cors" })` is refused by the privacy lock.
8. Storage holds only allowed keys.
9. `document.documentElement.scrollWidth` is not larger than the window width.
10. Typing `<img src=1>` into the box and cleaning shows it as plain text in Need a look and adds no image to the page.

Also check by hand: `98400 12345`, `+91-98400-12345` and `098400 12345` give "3 entries, 2 duplicates removed."

---

## 11. Phases

Stop after every phase, give me the Phase Report, and wait for me to say "Go".

**Phase 1: Shell and loader (10 min).** Git, `index.html` with the privacy lock, tokens, themes, header, footer, loader, hero layout on laptop and phone, `store.js`, `theme-init.js`.

**Phase 2: Clean and count (20 min).** Input card, sample, paste, open file, clear, scan, result card with count-up, tiles, bar and merge moment, with all their micro-interactions.

**Phase 3: Output and the rest (15 min).** Output panel with copy and downloads, detail tabs, privacy strip, DSA section, habits, CTA, hover effects, scroll reveal.

**Phase 4: Finish and deploy (15 min).**
1. Build `?test=1`. Fix everything until it passes. Check all widths in rule 12 and both themes. Check reduced motion.
2. Make `og-image.png` (1200 x 630, Wrench Wise colours, the line "1,240 entries, 312 duplicates removed.", no phone numbers or emails shown).
3. Help me push the folder to GitHub. I will give you my empty repository URL.
4. Deploy on Vercel as a static site with no build command.
5. Set `config.siteUrl`, `og:url` and `og:image` to the live address, then redeploy.
6. Give click-by-click steps for anything I must do myself.
7. Confirm the live site works on a phone-sized screen and that `?test=1` passes live. Confirm the page still works with the network off after loading.
8. Tag the release `v1.0.0`, push the tag and give me the live link.

---

## 12. Phase Report format

- **What I built** (3 to 5 bullets)
- **How to check it** (click steps)
- **Screenshots** (phone and laptop)
- **verify.mjs result**
- **Not working or cut,** explained in plain words
- **Time used** against the target

---

## 13. If something keeps breaking

- If the same bug survives two fix attempts, stop. Explain it in plain words and give me options. Do not keep looping.
- If I say "Park it", move that feature to a "Parked" list in the Phase Report and continue.
- If time runs short, park in this order:
  1. `manifest.json` install support
  2. Open a file
  3. Scroll reveal
  4. The Paste button (pasting with the keyboard still works)
  5. The Tidied tab

**Never park:**
- Every rule in Section 2, above all the privacy lock and rule 4
- The loader, hover effects and core micro-interactions (scan, count-up, bar, merge moment, copy)
- The result card, the Clean list tab with copy and both downloads, and the Duplicates and Need a look tabs
- Phone and laptop layouts, light and dark themes
- Wrench Wise branding and the CTA
- `verify.mjs`, `?test=1` and deployment
