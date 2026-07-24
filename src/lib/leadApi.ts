const LEAD_ENDPOINT =
  import.meta.env.VITE_LEAD_API_URL?.trim() ||
  "https://moj-chatbot-backend.vercel.app/api/lead";
const FALLBACK_RECIPIENT = "daniel@vendzur.sk";

export type LeadSubmission = {
  source: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  web?: string;
  note?: string;
  interest?: string;
  industry?: string;
  features?: string;
  timeline?: string;
  consent: boolean;
};

type LeadResponse = {
  ok?: boolean;
  error?: string;
  fallback?: string;
};

function localFallback(payload: LeadSubmission): string {
  const subject = `Nový dopyt — ${payload.company?.trim() || payload.name.trim()}`;
  const body = [
    `Zdroj: ${payload.source}`,
    `Meno: ${payload.name}`,
    `E-mail: ${payload.email || "neuvedený"}`,
    `Telefón: ${payload.phone || "neuvedený"}`,
    `Firma: ${payload.company || "neuvedená"}`,
    `Web: ${payload.web || "neuvedený"}`,
    "",
    `Riešenie: ${payload.interest || "neuvedené"}`,
    `Odvetvie: ${payload.industry || "neuvedené"}`,
    `Funkcie: ${payload.features || "neuvedené"}`,
    `Termín: ${payload.timeline || "neuvedený"}`,
    "",
    "Poznámka:",
    payload.note || "bez poznámky",
  ].join("\n");
  return `mailto:${FALLBACK_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function submitLead(payload: LeadSubmission): Promise<{ fallback?: string }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => ({}))) as LeadResponse;
    if (response.ok && data.ok) return {};
    return { fallback: data.fallback || localFallback(payload) };
  } catch {
    return { fallback: localFallback(payload) };
  } finally {
    window.clearTimeout(timeout);
  }
}
