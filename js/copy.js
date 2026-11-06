// All words on the site. Do not reword unless I ask. Use t("hero.title") to read one.
// {name} parts are filled in by t(key, { name: value }).

export const COPY = {
  brand: "Wrench Wise",
  hero: {
    eyebrow: "Free list cleaner",
    title: "Clean any contact list in one click.",
    sub: "Paste phone numbers or emails. Duplicates go, formats get fixed, and you get a clean list to copy or download."
  },
  input: {
    label: "Your list",
    placeholder: "Paste phone numbers or emails here. One per line, or mixed in with names and text.",
    lines: "{lines} lines",
    clean: "Clean list",
    sample: "Try a messy sample",
    paste: "Paste",
    open: "Open a file",
    clear: "Clear",
    shortcut: "Ctrl + Enter also cleans",
    pasteBlocked: "Your browser blocked the Paste button. Press Ctrl + V, or long-press the box and choose Paste.",
    fileTooBig: "This file is larger than {mb} MB. Split it and try again.",
    fileType: "Open a .csv or .txt file.",
    truncated: "This list is very long, so only the first {max} entries were cleaned."
  },
  privacy: {
    line: "Nothing you paste is stored or sent. It all runs on your device.",
    proofTitle: "Check it yourself",
    proof: "Load this page, turn on airplane mode, and it still works. The page is also locked so that it cannot send anything out.",
    advice: "Contact lists hold other people's details. This page keeps them on your device."
  },
  result: {
    empty: "Your clean list shows up here.",
    emptySub: "Paste a list, or try the messy sample.",
    split: "{phones} phone numbers and {emails} emails",
    kept: "Clean contacts",
    duplicates: "Duplicates removed",
    fixed: "Tidied",
    invalid: "Need a look",
    barKept: "Kept",
    barDuplicates: "Duplicates",
    barInvalid: "Need a look",
    mergeTitle: "Most repeated",
    mergeTimes: "{count} times",
    skipped: "{count} lines of other text, like names, were skipped."
  },
  tabs: {
    clean: "Clean list",
    duplicates: "Duplicates",
    fixed: "Tidied",
    invalid: "Need a look"
  },
  output: {
    format: "Phone format",
    formats: {
      e164: "+919840012345",
      spaced: "+91 98400 12345",
      plain: "9840012345",
      wa: "919840012345"
    },
    formatNotes: {
      e164: "International. Best for CRMs.",
      spaced: "Easy to read.",
      plain: "10 digits. Best for Excel.",
      wa: "For WhatsApp tools."
    },
    show: "Show",
    all: "All",
    phones: "Phones",
    emails: "Emails",
    order: "Order",
    sorted: "A to Z",
    asPasted: "As pasted",
    separator: "Separate with",
    lines: "New lines",
    commas: "Commas",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Copy did not work. Select the list and copy it by hand.",
    csv: "Download CSV",
    txt: "Download TXT",
    preview: "Showing the first {shown} of {total}. Copy or download to get all of them.",
    excelTip: "Opening the CSV in Excel? Pick the 10-digit format, or Excel may show long numbers like 9.2E+11.",
    nothing: "Nothing to show for this filter."
  },
  details: {
    duplicatesEmpty: "No duplicates in this list.",
    alsoAs: "Also written as",
    gmail: "Gmail ignores dots and anything after a plus, so ravi.k@gmail.com and ravik@gmail.com reach the same inbox and count as one.",
    fixedEmpty: "Nothing needed tidying.",
    before: "Before",
    after: "After",
    invalidEmpty: "Everything in this list was usable.",
    limit: "Showing the first {shown} of {total}."
  },
  reasons: {
    short: { title: "Too few digits", detail: "A mobile number needs 10 digits." },
    long: { title: "Too many digits", detail: "This may be two numbers stuck together, or a number with extra digits." },
    landline: { title: "Not an Indian mobile number", detail: "Indian mobiles have 10 digits and start with 6, 7, 8 or 9." },
    pattern: { title: "Looks made up", detail: "Numbers like 9999999999 or 9876543210 are usually fake." },
    excel: { title: "Damaged by Excel", detail: "Excel shortened this to a form like 9.84E+09, so the real digits are lost. Format the column as Text in Excel and copy it again." },
    email: { title: "Not a valid email", detail: "Check for a missing part, like the @ or the .com." },
    nocontact: { title: "No number or email found", detail: "This line has digits, but not a phone number or email." }
  },
  hood: {
    heading: "The DSA behind this page",
    normTitle: "Standard form first",
    norm: "+91 98400 12345, 098400-12345 and 919840012345 are the same number. Each entry is rewritten to one standard form before checking, so none slip through.",
    hashTitle: "Hash set",
    hash: "A hash set answers \"seen this before?\" in one step, however long the list is.",
    hashLive: "Your list needed {lookups} lookups. Comparing every pair would take {pairs} comparisons.",
    sortTitle: "Sorting",
    sort: "The clean list is put in order with merge sort. It splits the list in halves, sorts each half and merges them back.",
    sortLive: "Sorting your list took {comparisons} comparisons."
  },
  tips: {
    heading: "Three habits for clean lists",
    one: "Keep phone numbers in one column, with +91.",
    two: "Format phone columns as Text in Excel.",
    three: "Clean every list before you upload it anywhere."
  },
  cta: {
    title: "Want to build tools like this?",
    body: "This page is built with a hash set, merge sort and plain JavaScript. Learn these skills step by step in the {program}.",
    button: "Explore the program",
    whatsApp: "Talk to us on WhatsApp"
  },
  footer: {
    built: "Built by Wrench Wise",
    privacy: "Nothing you paste here is stored or sent."
  },
  noScript: "This page needs JavaScript to run."
};

export function t(key, values = {}) {
  const found = key.split(".").reduce((node, part) => node?.[part], COPY);
  if (typeof found !== "string") return "";
  return found.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);
}
