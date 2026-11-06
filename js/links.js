// Helper for program and WhatsApp URLs with UTM tracking
import { CONFIG } from "../config.js";

export function getProgramLink() {
  const base = CONFIG.program?.page ? CONFIG.program.page : CONFIG.website;
  const url = new URL(base);
  if (CONFIG.utm) {
    if (CONFIG.utm.source) url.searchParams.set("utm_source", CONFIG.utm.source);
    if (CONFIG.utm.medium) url.searchParams.set("utm_medium", CONFIG.utm.medium);
    if (CONFIG.utm.campaign) url.searchParams.set("utm_campaign", CONFIG.utm.campaign);
  }
  return url.toString();
}

export function getWhatsAppLink() {
  if (!CONFIG.salesWhatsApp) return null;
  const text = (CONFIG.whatsAppText || "").replace("{program}", CONFIG.program?.name || "");
  return "https://wa.me/" + encodeURIComponent(CONFIG.salesWhatsApp) + "?text=" + encodeURIComponent(text);
}
