export type EmailLead = Record<string, string>;

const esc = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const multiline = (value: string) => esc(value).replace(/\r?\n/g, "<br>");

const webHref = (value: string) => {
  if (!value) return "";
  try {
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
};

const phoneHref = (value: string) => (value ? `tel:${value.replace(/[^\d+]/g, "")}` : "");

const shell = (recipient: string, preheader: string, content: string) => `<!doctype html>
<html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>Môj Chatbot</title>
<style>@media(max-width:640px){.shell{width:100%!important}.pad{padding-left:20px!important;padding-right:20px!important}.hero{padding:28px 20px!important}.title{font-size:28px!important}.stack{display:block!important;width:100%!important;text-align:left!important;padding:0!important}.button{display:block!important;text-align:center!important}}</style></head>
<body style="margin:0;background:#f2ede7;color:#17130f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2ede7"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" class="shell" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:640px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 18px 56px rgba(23,19,15,.12)">${content}</table>
<table role="presentation" class="shell" width="640" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:20px 18px 0;color:#81766d;font-size:12px;line-height:1.6"><strong style="color:#4a423c">Môj Chatbot</strong> · AI asistenti, konfigurátory a kalkulačky pre firmy<br><a href="https://mojchatbot.sk" style="color:#9a5d32;text-decoration:none">mojchatbot.sk</a> · <a href="mailto:${esc(recipient)}" style="color:#9a5d32;text-decoration:none">${esc(recipient)}</a></td></tr></table>
</td></tr></table></body></html>`;

const header = (label: string) => `<tr><td style="background:#0b0d11;padding:20px 28px;border-bottom:1px solid #24211e"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td><table role="presentation" cellspacing="0" cellpadding="0"><tr><td align="center" width="40" height="40" style="border-radius:13px;background:#ffc79d;color:#17130f;font-size:18px;font-weight:800">M</td><td style="padding-left:12px;color:#fff8f1;font-size:16px;font-weight:750">Môj Chatbot</td></tr></table></td><td align="right" style="color:#ffc79d;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">${esc(label)}</td></tr></table></td></tr>`;

const row = (label: string, value: string, href = "") => {
  const shown = href
    ? `<a href="${esc(href)}" style="color:#17130f;text-decoration:none;font-weight:650;word-break:break-word">${esc(value)}</a>`
    : `<strong style="color:#17130f;word-break:break-word">${esc(value)}</strong>`;
  return `<tr><td valign="top" width="124" style="padding:10px 0;border-bottom:1px solid #eee7e0;color:#8b7f75;font-size:11px;letter-spacing:.06em;text-transform:uppercase">${esc(label)}</td><td valign="top" style="padding:10px 0 10px 16px;border-bottom:1px solid #eee7e0;font-size:14px;line-height:1.55">${shown}</td></tr>`;
};

const section = (title: string, rows: string) => `<tr><td class="pad" style="padding:26px 36px 0"><h2 style="margin:0 0 9px;font-size:18px;letter-spacing:-.02em">${esc(title)}</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table></td></tr>`;

export function internalText(lead: EmailLead): string {
  return [
    `Zdroj: ${lead.source || "web"}`,
    `Meno: ${lead.name}`,
    `E-mail: ${lead.email || "neuvedený"}`,
    `Telefón: ${lead.phone || "neuvedený"}`,
    `Firma: ${lead.company || "neuvedená"}`,
    `Web: ${lead.web || "neuvedený"}`,
    "",
    `Riešenie: ${lead.interest || "neuvedené"}`,
    `Odvetvie: ${lead.industry || "neuvedené"}`,
    `Funkcie: ${lead.features || "neuvedené"}`,
    `Termín: ${lead.timeline || "neuvedený"}`,
    `Číslo dopytu: ${lead.reference || "neuvedené"}`,
    "",
    "Poznámka:",
    lead.note || "bez poznámky",
  ].join("\n");
}

export function internalHtml(lead: EmailLead, recipient: string): string {
  const title = lead.company || lead.name;
  const phone = phoneHref(lead.phone);
  const web = webHref(lead.web);
  const action = lead.email
    ? `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(`Re: ${lead.reference ? `${lead.reference} · ` : ""}Môj Chatbot`)}`
    : phone;
  return shell(recipient, `Nový dopyt od ${title}`, `${header("Nový dopyt")}
<tr><td class="hero" style="padding:36px;background:#17130f"><span style="display:inline-block;padding:7px 11px;border:1px solid rgba(255,199,157,.28);border-radius:999px;background:rgba(255,199,157,.1);color:#ffc79d;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase">${esc(lead.reference || "bez čísla")}</span><h1 class="title" style="margin:18px 0 8px;color:#fff8f1;font-size:34px;line-height:1.15;letter-spacing:-.045em">${esc(title)}</h1><p style="margin:0;color:#bdb3aa;font-size:15px;line-height:1.65">Nový kontakt odoslal zadanie cez ${esc(lead.source || "web")}.</p></td></tr>
<tr><td class="pad" style="padding:28px 36px 0"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff6ef;border:1px solid #f2d8c5;border-radius:16px"><tr><td style="padding:18px 20px"><div style="color:#9a5d32;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase">Priorita</div><div style="margin-top:5px;font-size:16px;font-weight:750">Dopyt čaká na spracovanie</div><div style="margin-top:4px;color:#756a61;font-size:13px;line-height:1.55">Odpoveď môže ísť priamo zákazníkovi cez tlačidlo nižšie.</div></td></tr></table></td></tr>
${section("Kontakt", `${row("Meno", lead.name)}${row("E-mail", lead.email || "neuvedený", lead.email ? `mailto:${lead.email}` : "")}${row("Telefón", lead.phone || "neuvedený", phone)}${row("Firma", lead.company || "neuvedená")}${row("Web", lead.web || "neuvedený", web)}`)}
${section("Zadanie", `${row("Riešenie", lead.interest || "neuvedené")}${row("Odvetvie", lead.industry || "neuvedené")}${row("Funkcie", lead.features || "neuvedené")}${row("Termín", lead.timeline || "neuvedený")}${row("Zdroj", lead.source || "web")}`)}
<tr><td class="pad" style="padding:26px 36px 0"><h2 style="margin:0 0 10px;font-size:18px">Poznámka</h2><div style="padding:18px 20px;border-radius:16px;background:#f6f2ee;color:#3f3832;font-size:14px;line-height:1.7">${multiline(lead.note || "Bez poznámky")}</div></td></tr>
<tr><td class="pad" style="padding:28px 36px 36px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td class="stack"><a class="button" href="${esc(action)}" style="display:inline-block;padding:14px 20px;border-radius:12px;background:#17130f;color:#fff8f1;text-decoration:none;font-size:14px;font-weight:750">${lead.email ? "Odpovedať na dopyt" : "Zavolať kontaktu"}</a></td><td class="stack" align="right" style="padding-left:16px;color:#8b7f75;font-size:12px;line-height:1.55">Prijaté cez systém<br>Môj Chatbot</td></tr></table></td></tr>`);
}

export function confirmationText(lead: EmailLead, recipient: string): string {
  const firstName = lead.name.split(/\s+/)[0] || lead.name;
  return [
    `Dobrý deň, ${firstName},`,
    "",
    "ďakujeme za váš dopyt. Zadanie sme úspešne prijali a teraz si ho prejdeme.",
    "Ozveme sa vám najneskôr do jedného pracovného dňa s odporúčaním ďalšieho postupu.",
    "",
    "Čo ste nám poslali:",
    `• Riešenie: ${lead.interest || "upresníme spolu"}`,
    `• Odvetvie: ${lead.industry || "neuvedené"}`,
    `• Funkcie: ${lead.features || "upresníme spolu"}`,
    `• Termín: ${lead.timeline || "neuvedený"}`,
    lead.reference ? `• Číslo dopytu: ${lead.reference}` : "",
    "",
    "Potrebujete niečo doplniť? Stačí odpovedať na tento e-mail.",
    "",
    "Tím Môj Chatbot",
    `Môj Chatbot — ${recipient}, +421 948 699 433`,
    "mojchatbot.sk",
  ].filter(Boolean).join("\n");
}

const summary = (label: string, value: string) => `<tr><td valign="top" width="112" style="padding:9px 0;color:#8b7f75;font-size:12px">${esc(label)}</td><td valign="top" style="padding:9px 0 9px 14px;color:#17130f;font-size:14px;font-weight:650;line-height:1.55">${esc(value)}</td></tr>`;

export function confirmationHtml(lead: EmailLead, recipient: string): string {
  const firstName = lead.name.split(/\s+/)[0] || lead.name;
  return shell(recipient, "Dopyt sme prijali. Ozveme sa vám najneskôr do jedného pracovného dňa.", `${header("Potvrdenie")}
<tr><td class="hero" align="center" style="padding:42px 36px 34px;background:#17130f"><div style="width:54px;height:54px;line-height:54px;margin:0 auto 20px;border-radius:18px;background:#ffc79d;color:#17130f;font-size:25px;font-weight:900">✓</div><div style="color:#ffc79d;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Dopyt sme prijali</div><h1 class="title" style="margin:12px 0;color:#fff8f1;font-size:34px;line-height:1.15;letter-spacing:-.045em">Ďakujeme, ${esc(firstName)}.</h1><p style="max-width:500px;margin:0 auto;color:#c8beb5;font-size:15px;line-height:1.7">Zadanie máme bezpečne uložené. Prejdeme si ho a ozveme sa vám najneskôr do jedného pracovného dňa s odporúčaním ďalšieho postupu.</p></td></tr>
<tr><td class="pad" style="padding:30px 36px 0"><h2 style="margin:0 0 12px;font-size:18px">Čo ste nám poslali</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f3ef;border-radius:16px"><tr><td style="padding:14px 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${summary("Riešenie", lead.interest || "Upresníme spolu")}${summary("Odvetvie", lead.industry || "Neuvedené")}${summary("Funkcie", lead.features || "Upresníme spolu")}${summary("Termín", lead.timeline || "Neuvedený")}${lead.reference ? summary("Číslo dopytu", lead.reference) : ""}</table></td></tr></table></td></tr>
<tr><td class="pad" style="padding:28px 36px 0"><h2 style="margin:0 0 14px;font-size:18px">Čo bude nasledovať</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td width="38" valign="top"><div style="width:30px;height:30px;line-height:30px;border-radius:10px;background:#fff1e6;color:#9a5d32;font-size:13px;font-weight:800;text-align:center">1</div></td><td style="padding:3px 0 16px 12px;color:#3f3832;font-size:14px;line-height:1.6"><strong style="color:#17130f">Prejdeme si zadanie</strong><br>Skontrolujeme rozsah, ciele a informácie, ktoré ste poslali.</td></tr><tr><td width="38" valign="top"><div style="width:30px;height:30px;line-height:30px;border-radius:10px;background:#fff1e6;color:#9a5d32;font-size:13px;font-weight:800;text-align:center">2</div></td><td style="padding:3px 0 16px 12px;color:#3f3832;font-size:14px;line-height:1.6"><strong style="color:#17130f">Navrhneme vhodné riešenie</strong><br>Pripravíme odporúčaný postup podľa potrieb vašej firmy.</td></tr><tr><td width="38" valign="top"><div style="width:30px;height:30px;line-height:30px;border-radius:10px;background:#17130f;color:#ffc79d;font-size:13px;font-weight:800;text-align:center">3</div></td><td style="padding:3px 0 0 12px;color:#3f3832;font-size:14px;line-height:1.6"><strong style="color:#17130f">Ozveme sa vám</strong><br>Najneskôr do jedného pracovného dňa dostanete ďalšie kroky.</td></tr></table></td></tr>
<tr><td class="pad" style="padding:30px 36px 36px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff6ef;border:1px solid #f2d8c5;border-radius:16px"><tr><td style="padding:20px"><div style="font-size:15px;font-weight:750">Potrebujete niečo doplniť?</div><div style="margin-top:5px;color:#756a61;font-size:13px;line-height:1.6">Stačí odpovedať na tento e-mail. Vaša správa sa priradí k dopytu.</div><a href="mailto:${esc(recipient)}" style="display:inline-block;margin-top:16px;padding:12px 17px;border-radius:11px;background:#17130f;color:#fff8f1;text-decoration:none;font-size:13px;font-weight:750">Doplniť informácie</a></td></tr></table><div style="margin-top:26px;color:#3f3832;font-size:14px;line-height:1.65">S pozdravom,<br><strong style="color:#17130f">Tím Môj Chatbot</strong></div></td></tr>`);
}
