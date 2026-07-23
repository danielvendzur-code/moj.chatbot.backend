const LEAD_ENDPOINT =
  import.meta.env.VITE_LEAD_API_URL?.trim() ||
  "https://moj-chatbot-backend.vercel.app/api/lead";

export type LeadSubmission = {
  source: string;
  name: string;
  email: string;
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
    if (data.fallback) return { fallback: data.fallback };
    throw new Error(data.error || `lead-${response.status}`);
  } finally {
    window.clearTimeout(timeout);
  }
}
