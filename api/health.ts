import type { VercelRequest, VercelResponse } from "@vercel/node";

const RELEASE = "sales-sonnet-20260906-v1";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, error: "method-not-allowed" });
    return;
  }

  res.status(200).json({
    ok: true,
    service: "moj-chatbot-backend",
    release: RELEASE,
    chatModel: "claude-sonnet-4-6",
    leadDeliveryTimeoutsMs: {
      resend: 5_500,
      confirmation: 3_000,
      webhook: 2_500,
    },
  });
}
