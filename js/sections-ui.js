// Sections UI: Privacy strip, DSA section, Habits, and CTA
import { COPY, t } from "./copy.js";
import { fmt } from "./engine/cleaner.js";
import { CONFIG } from "../config.js";
import { getProgramLink, getWhatsAppLink } from "./links.js";

export function renderSections(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const wrapper = document.createElement("div");
  wrapper.className = "container sections-wrapper";

  // 1. Privacy Strip
  const privacyCard = document.createElement("section");
  privacyCard.className = "privacy-strip-card reveal-on-scroll";
  privacyCard.setAttribute("aria-label", COPY.privacy.proofTitle);

  const privHeader = document.createElement("div");
  privHeader.className = "privacy-strip-header";
  privHeader.appendChild(createShieldIcon());
  const privTitle = document.createElement("h2");
  privTitle.className = "privacy-strip-title";
  privTitle.textContent = COPY.privacy.proofTitle;
  privHeader.appendChild(privTitle);
  privacyCard.appendChild(privHeader);

  const privLine = document.createElement("p");
  privLine.className = "privacy-strip-body";
  privLine.style.fontWeight = "700";
  privLine.textContent = COPY.privacy.line;
  privacyCard.appendChild(privLine);

  const privProof = document.createElement("p");
  privProof.className = "privacy-strip-body";
  privProof.textContent = COPY.privacy.proof;
  privacyCard.appendChild(privProof);

  const privAdvice = document.createElement("p");
  privAdvice.className = "privacy-advice-text";
  privAdvice.textContent = COPY.privacy.advice;
  privacyCard.appendChild(privAdvice);

  wrapper.appendChild(privacyCard);

  // 2. DSA Section
  if (CONFIG.features?.underTheHood !== false) {
    const dsaSec = document.createElement("section");
    dsaSec.className = "dsa-section reveal-on-scroll";
    dsaSec.setAttribute("aria-label", COPY.hood.heading);

    const dsaHeading = document.createElement("h2");
    dsaHeading.className = "section-heading";
    dsaHeading.textContent = COPY.hood.heading;
    dsaSec.appendChild(dsaHeading);

    const dsaGrid = document.createElement("div");
    dsaGrid.className = "dsa-grid";

    // Card 1: Standard form first
    const card1 = document.createElement("div");
    card1.className = "dsa-card";
    const title1 = document.createElement("h3");
    title1.className = "dsa-card-title";
    title1.textContent = COPY.hood.normTitle;
    const body1 = document.createElement("p");
    body1.className = "dsa-card-body";
    body1.textContent = COPY.hood.norm;
    card1.appendChild(title1);
    card1.appendChild(body1);
    dsaGrid.appendChild(card1);

    // Card 2: Hash set
    const card2 = document.createElement("div");
    card2.className = "dsa-card";
    const title2 = document.createElement("h3");
    title2.className = "dsa-card-title";
    title2.textContent = COPY.hood.hashTitle;
    const body2 = document.createElement("p");
    body2.className = "dsa-card-body";
    body2.textContent = COPY.hood.hash;
    const live2 = document.createElement("p");
    live2.id = "dsa-hash-live";
    live2.className = "dsa-card-live";
    live2.style.display = "none";
    card2.appendChild(title2);
    card2.appendChild(body2);
    card2.appendChild(live2);
    dsaGrid.appendChild(card2);

    // Card 3: Sorting
    const card3 = document.createElement("div");
    card3.className = "dsa-card";
    const title3 = document.createElement("h3");
    title3.className = "dsa-card-title";
    title3.textContent = COPY.hood.sortTitle;
    const body3 = document.createElement("p");
    body3.className = "dsa-card-body";
    body3.textContent = COPY.hood.sort;
    const live3 = document.createElement("p");
    live3.id = "dsa-sort-live";
    live3.className = "dsa-card-live";
    live3.style.display = "none";
    card3.appendChild(title3);
    card3.appendChild(body3);
    card3.appendChild(live3);
    dsaGrid.appendChild(card3);

    dsaSec.appendChild(dsaGrid);
    wrapper.appendChild(dsaSec);
  }

  // 3. Three Habits Section
  const habitsSec = document.createElement("section");
  habitsSec.className = "habits-section reveal-on-scroll";
  habitsSec.setAttribute("aria-label", COPY.tips.heading);

  const habitsHeading = document.createElement("h2");
  habitsHeading.className = "section-heading";
  habitsHeading.textContent = COPY.tips.heading;
  habitsSec.appendChild(habitsHeading);

  const habitsGrid = document.createElement("div");
  habitsGrid.className = "habits-grid";

  const habitItems = [
    { num: "1", text: COPY.tips.one },
    { num: "2", text: COPY.tips.two },
    { num: "3", text: COPY.tips.three }
  ];

  for (const h of habitItems) {
    const card = document.createElement("div");
    card.className = "habit-card";
    const numBadge = document.createElement("span");
    numBadge.className = "habit-number tabular";
    numBadge.textContent = h.num;
    const textEl = document.createElement("p");
    textEl.className = "habit-text";
    textEl.textContent = h.text;
    card.appendChild(numBadge);
    card.appendChild(textEl);
    habitsGrid.appendChild(card);
  }
  habitsSec.appendChild(habitsGrid);
  wrapper.appendChild(habitsSec);

  // 4. CTA Section
  const ctaSec = document.createElement("section");
  ctaSec.className = "cta-card reveal-on-scroll";
  ctaSec.setAttribute("aria-label", COPY.cta.title);

  const ctaTitle = document.createElement("h2");
  ctaTitle.className = "cta-title";
  ctaTitle.textContent = COPY.cta.title;
  ctaSec.appendChild(ctaTitle);

  const ctaBody = document.createElement("p");
  ctaBody.className = "cta-body";
  ctaBody.textContent = t("cta.body", { program: CONFIG.program?.name || "" });
  ctaSec.appendChild(ctaBody);

  const ctaButtons = document.createElement("div");
  ctaButtons.className = "cta-buttons";

  // Program link button
  const btnProgram = document.createElement("a");
  btnProgram.href = getProgramLink();
  btnProgram.target = "_blank";
  btnProgram.rel = "noopener noreferrer";
  btnProgram.className = "btn btn-primary";
  btnProgram.textContent = COPY.cta.button;
  ctaButtons.appendChild(btnProgram);

  // WhatsApp link button
  const waUrl = getWhatsAppLink();
  if (waUrl) {
    const btnWa = document.createElement("a");
    btnWa.href = waUrl;
    btnWa.target = "_blank";
    btnWa.rel = "noopener noreferrer";
    btnWa.className = "btn btn-whatsapp";
    btnWa.appendChild(createWhatsAppIcon());
    const waText = document.createElement("span");
    waText.textContent = COPY.cta.whatsApp;
    btnWa.appendChild(waText);
    ctaButtons.appendChild(btnWa);
  }

  ctaSec.appendChild(ctaButtons);
  wrapper.appendChild(ctaSec);

  container.appendChild(wrapper);
}

export function updateDsaStats(dsa) {
  if (!dsa) return;

  const hashLive = document.getElementById("dsa-hash-live");
  if (hashLive) {
    hashLive.textContent = t("hood.hashLive", {
      lookups: fmt(dsa.lookups),
      pairs: fmt(dsa.pairs)
    });
    hashLive.style.display = "block";
  }

  const sortLive = document.getElementById("dsa-sort-live");
  if (sortLive) {
    sortLive.textContent = t("hood.sortLive", {
      comparisons: fmt(dsa.sortComparisons)
    });
    sortLive.style.display = "block";
  }
}

function createShieldIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "28");
  svg.setAttribute("height", "28");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("class", "privacy-shield-icon");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z");
  svg.appendChild(path);
  return svg;
}

function createWhatsAppIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.182 8.182 0 0 1 2.41 5.83c.01 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.17 1.74 2.65 4.21 3.72.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z");
  svg.appendChild(path);
  return svg;
}
