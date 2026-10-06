import "server-only";
import { site } from "./site";

type Email = { to: string; subject: string; html: string; text?: string };

/**
 * Send a transactional email through Resend. Without RESEND_API_KEY the email
 * is printed to the server console instead, so every flow works in development.
 */
export async function sendEmail({ to, subject, html, text }: Email) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${site.name} <hello@aayatalruh.com>`;

  if (!key) {
    console.info(`\n✉  [email:dev] to=${to}\n   subject=${subject}\n   ${text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 400)}\n`);
    return { ok: true as const, dev: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!res.ok) {
    console.error("[email] Resend error", res.status, await res.text().catch(() => ""));
    return { ok: false as const };
  }
  return { ok: true as const };
}

/** Shared noir & gold email shell. */
export function emailLayout({ title, preheader, body }: { title: string; preheader?: string; body: string }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;background:#0b0907;color:#f4ecdd;font-family:Helvetica,Arial,sans-serif">
<span style="display:none;opacity:0">${preheader ?? ""}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0907;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#15100c;border:1px solid #3d2e20">
<tr><td style="padding:32px 36px 8px;text-align:center">
<img src="${site.url}/brand/logo-on-dark-sm.png" width="120" height="134" alt="Aayat al-Ruh" style="display:inline-block;width:120px;height:auto;border:0">
</td></tr>
<tr><td style="padding:16px 36px 36px;font-size:15px;line-height:1.65;color:#e7d9c0">${body}</td></tr>
<tr><td style="padding:20px 36px;border-top:1px solid #3d2e20;font-size:11px;color:#8a7f70;text-align:center">
${site.name} · ${site.contact.address}<br>${site.contact.email}
</td></tr>
</table></td></tr></table></body></html>`;
}
