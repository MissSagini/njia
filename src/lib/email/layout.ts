import "server-only";

/**
 * One look for every email Njia sends: a white card on Cream, a Fraunces-like
 * serif title, an optional Forest button, and a plain-text twin. Inline styles,
 * because email clients ignore stylesheets.
 */

type EmailContent = {
  /** Small label above the title, like "Your free call". */
  eyebrow: string;
  title: string;
  paragraphs: string[];
  /** Label and value pairs, like a call time. */
  rows?: [string, string][];
  button?: { label: string; url: string };
  /** Shown after the button. */
  after?: string[];
  /** Why they're getting this, in small print. */
  footer: string;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const P = "margin:0 0 16px;font:16px/26px Arial,sans-serif;color:#1C2A23";
const CELL = "padding:10px 0;border-top:1px solid #E6DCCB;font:16px/24px Arial,sans-serif;color:#1C2A23;vertical-align:top";

export function renderEmail(c: EmailContent): { html: string; text: string } {
  const html = `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#FBF6EE">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E6DCCB;border-radius:12px" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 24px">
<p style="margin:0 0 6px;font:bold 12px/16px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#1F4D3A">${esc(c.eyebrow)}</p>
<h1 style="margin:0 0 16px;font:600 26px/32px Georgia,serif;color:#1C2A23">${esc(c.title)}</h1>
${c.paragraphs.map((p) => `<p style="${P}">${esc(p)}</p>`).join("\n")}
${
  c.rows?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">${c.rows
        .map(([k, v]) => `<tr><td style="${CELL};width:38%;font-weight:bold">${esc(k)}</td><td style="${CELL}">${esc(v)}</td></tr>`)
        .join("")}</table>`
    : ""
}
${
  c.button
    ? `<p style="margin:8px 0 20px"><a href="${esc(c.button.url)}" style="display:inline-block;padding:14px 24px;background:#1F4D3A;border-radius:12px;color:#FFFFFF;font:bold 16px/22px Arial,sans-serif;text-decoration:none">${esc(c.button.label)}</a></p>`
    : ""
}
${(c.after ?? []).map((p) => `<p style="${P}">${esc(p)}</p>`).join("\n")}
<p style="margin:0;font:16px/26px Arial,sans-serif;color:#1C2A23">The Njia team</p>
</td></tr></table>
<p style="max-width:560px;margin:16px auto 0;font:13px/20px Arial,sans-serif;color:#5A6660;text-align:center">${esc(c.footer)}</p>
</body></html>`;

  const text = [
    c.title,
    "",
    ...c.paragraphs.flatMap((p) => [p, ""]),
    ...(c.rows?.length ? [...c.rows.map(([k, v]) => `${k}: ${v}`), ""] : []),
    ...(c.button ? [`${c.button.label}: ${c.button.url}`, ""] : []),
    ...(c.after ?? []).flatMap((p) => [p, ""]),
    "The Njia team",
    "",
    c.footer,
  ].join("\n");

  return { html, text };
}
