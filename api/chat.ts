import Anthropic from "@anthropic-ai/sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/*
 * Serverless proxy pre AI chat widgetu (nasadené na Vercel).
 *
 * Prečo: GitHub Pages je statický, takže ANTHROPIC_API_KEY sa nesmie dostať
 * do prehliadača. Táto funkcia beží na serveri, drží kľúč v env premennej a
 * je jediná, kto volá Claude API.
 *
 * Nastavenie na Verceli:
 *   1. Prepojte repozitár s Vercel projektom.
 *   2. V Project Settings → Environment Variables pridajte ANTHROPIC_API_KEY.
 *   3. URL nasadenej funkcie (…/api/chat) vložte do src/lib/assistantApi.ts
 *      (alebo cez window.__DV_ASSISTANT_ENDPOINT__).
 */

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 512;
const MAX_MESSAGES = 12;
const MAX_CHARS = 1000;

/* Weby, z ktorých smie widget volať. */
const ALLOWED_ORIGINS = [/^https:\/\/danielvendzur-code\.github\.io$/, /^http:\/\/localhost(:\d+)?$/];

const SYSTEM_PROMPT = [
  "Si priateľský slovenský asistent na webe Daniela Vendzúra, ktorý na mieru vyvíja",
  "webových asistentov pre firmy. Pomáhaš návštevníkovi zorientovať sa a vybrať vhodné riešenie.",
  "",
  "Čo Daniel ponúka:",
  "• AI chatbot — odpovedá návštevníkom 24/7, zaučený na služby, ceny a postupy firmy.",
  "• Chatbot s kalkulačkou — spočíta orientačnú cenu podľa parametrov a spraví z nej dopyt.",
  "• Produktový konfigurátor — výber modelu, variantov a doplnkov aj s cenou.",
  "• Rezervačný chatbot — krátky dopyt, výber termínu a automatické pripomienky.",
  "",
  "Pravidlá:",
  "• Odpovedaj po slovensky, stručne a konkrétne (max pár viet). Bez markdownu.",
  "• Nevymýšľaj konkrétne ceny ani termíny. Na cenu nasmeruj na konfigurátor v okne",
  "  („Vyskladať riešenie“) alebo ponúkni nechať kontakt — Daniel sa ozve s návrhom.",
  "• Ostaň pri téme webových asistentov a Danielových služieb. Ak sa niekto pýta na",
  "  úplne inú tému, slušne to odmietni a vráť sa k tomu, s čím vieš pomôcť.",
  "• Pri zložitých alebo špecifických požiadavkách odporuč ozvať sa priamo cez formulár.",
].join("\n");

type IncomingMessage = { role?: unknown; content?: unknown };

function pickOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  return ALLOWED_ORIGINS.some((re) => re.test(origin)) ? origin : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const allowed = pickOrigin(req.headers.origin);
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "server-not-configured" });
    return;
  }

  /* Vstup: len roly user/assistant, obmedzený počet a dĺžka správ. */
  const body = (typeof req.body === "string" ? safeParse(req.body) : req.body) as {
    messages?: unknown;
  } | null;
  const rawMessages = Array.isArray(body?.messages) ? (body?.messages as IncomingMessage[]) : [];

  const cleaned = rawMessages
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string",
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  /* Claude vyžaduje, aby konverzácia začínala user správou. */
  const firstUser = cleaned.findIndex((m) => m.role === "user");
  const messages = firstUser === -1 ? [] : cleaned.slice(firstUser);

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    res.status(400).json({ error: "invalid-messages" });
    return;
  }

  try {
    const client = new Anthropic({ apiKey });
    const completion = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    res.status(200).json({ reply });
  } catch {
    res.status(502).json({ error: "upstream-error" });
  }
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
