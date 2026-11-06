// Every setting lives here. Change values here, never in other files.

export const CONFIG = {
  version: "1.0.0",

  // The live address. Set in Phase 4 (deploy). Used for link previews.
  siteUrl: "https://listcleaner-mu.vercel.app",

  // Sales WhatsApp: digits only, country code first. Empty hides the WhatsApp button.
  salesWhatsApp: "",
  whatsAppText: "Hi, I tried the List Cleaner. I want to know more about the {program}.",

  // The program the CTA sells. Always use the full name. page is its page on wrench-wise.com, or "" for the main site.
  program: {
    name: "Certification Program in AI-Powered Software Engineering & DSA",
    page: ""
  },

  website: "https://wrench-wise.com",
  utm: { source: "list-cleaner", medium: "web-project", campaign: "list-cleaner" },

  // Phone format picked when the page opens: "e164", "spaced", "plain" or "wa".
  defaultFormat: "e164",

  // true: ravi.k@gmail.com and ravik@gmail.com count as one, because Gmail delivers both to one inbox.
  gmailRule: true,

  previewRows: 500, // rows drawn on screen. Copy and download always include every row.
  maxFileMB: 4,
  countUpMs: 700,   // headline numbers count up for this long
  scanMs: 450,      // the scan line on the paste box. Results are ready before it ends.
  loaderMs: 800,    // the loader never runs longer than this

  // Switches. false hides the feature completely, with no errors.
  features: {
    darkTheme: true,
    pasteButton: true,
    fileOpen: true,
    mergeMoment: true,
    detailTabs: true,
    underTheHood: true
  }
};
