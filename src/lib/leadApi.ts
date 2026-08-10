const LEAD_ENDPOINT =
  import.meta.env.VITE_LEAD_API_URL?.trim() ||
  "https://moj-chatbot-backend.vercel.app/api/lead";
const FALLBACK_RECIPIENT = "info@mojchatbot.sk";

/* A photo the visitor attached. `data` is raw base64 without the data: prefix,
   which is exactly the shape Resend takes for an attachment. */
export type LeadAttachment = {
  filename: string;
  contentType: string;
  data: string;
};

export type LeadSubmission = {
  source: string;
  /* The quick message form asks only for an e-mail and a message, so the name
     is optional there and the server derives one from the address. */
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  web?: string;
  note?: string;
  interest?: string;
  industry?: string;
  features?: string;
  timeline?: string;
  reference?: string;
  attachments?: LeadAttachment[];
  consent: boolean;
};

type LeadResponse = {
  ok?: boolean;
  error?: string;
  reason?: string;
  fallback?: string;
};

function localFallback(payload: LeadSubmission): string {
  const name = payload.name?.trim() || payload.email?.trim() || "web";
  const subject = `Nový dopyt — ${payload.company?.trim() || name}`;
  const body = [
    `Zdroj: ${payload.source}`,
    `Meno: ${name}`,
    `E-mail: ${payload.email || "neuvedený"}`,
    `Telefón: ${payload.phone || "neuvedený"}`,
    `Firma: ${payload.company || "neuvedená"}`,
    `Web: ${payload.web || "neuvedený"}`,
    "",
    `Riešenie: ${payload.interest || "neuvedené"}`,
    `Odvetvie: ${payload.industry || "neuvedené"}`,
    `Funkcie: ${payload.features || "neuvedené"}`,
    `Termín: ${payload.timeline || "neuvedený"}`,
    `Číslo dopytu: ${payload.reference || "neuvedené"}`,
    "",
    "Poznámka:",
    payload.note || "bez poznámky",
    /* A mailto: cannot carry files, so say so rather than let the visitor
       believe the photos went along with it. */
    ...(payload.attachments?.length
      ? ["", `Pozn.: prílohy (${payload.attachments.length}) priložte prosím ručne.`]
      : []),
  ].join("\n");
  return `mailto:${FALLBACK_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* `delivered` says whether the enquiry actually reached me. When it did not,
   `fallback` opens the visitor's own mail client with everything prefilled, so
   a bad minute on the server never costs them the work they just did. */
export type LeadResult = { delivered: boolean; fallback?: string };

export async function submitLead(payload: LeadSubmission): Promise<LeadResult> {
  const controller = new AbortController();
  /* Text alone is a keystroke; a photo on a phone connection is not. Aborting
     an upload after 12 s would have thrown away a lead that was still on its
     way. */
  const timeout = window.setTimeout(
    () => controller.abort(),
    payload.attachments?.length ? 45_000 : 12_000,
  );

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
    if (response.ok && data.ok) return { delivered: true };
    /* The provider's own wording about why it refused. It never carries a
       credential, and having it in the console is what turns "it didn't
       arrive" into something the owner can act on. */
    if (data.reason) console.warn("lead-delivery-failed", data.reason);
    return { delivered: false, fallback: data.fallback || localFallback(payload) };
  } catch {
    return { delivered: false, fallback: localFallback(payload) };
  } finally {
    window.clearTimeout(timeout);
  }
}
