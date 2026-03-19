// E-Mail-Versand via Resend
import { Resend } from "resend";
import type { TagesschauSummary } from "./types";

/**
 * Sendet eine E-Mail mit der Tagesschau-Zusammenfassung.
 */
export async function sendSummaryEmail(
  summary: TagesschauSummary,
  siteUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.EMAIL_TO;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY ist nicht gesetzt.");
  }
  if (!emailTo) {
    throw new Error("EMAIL_TO ist nicht gesetzt.");
  }

  const resend = new Resend(apiKey);

  const html = buildEmailHtml(summary, siteUrl);

  const { error } = await resend.emails.send({
    from: "Tagesschau Bot <onboarding@resend.dev>",
    to: emailTo,
    subject: `📺 Tagesschau Zusammenfassung – ${formatDatum(summary.datum)}`,
    html,
  });

  if (error) {
    throw new Error(`E-Mail Fehler: ${JSON.stringify(error)}`);
  }
}

/**
 * Erstellt das HTML für die E-Mail.
 */
function buildEmailHtml(
  summary: TagesschauSummary,
  siteUrl: string
): string {
  const themenHtml = summary.themen
    .map(
      (thema, index) => `
      <tr>
        <td style="padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 8px; color: #1a56db; font-size: 16px;">
            ${index + 1}. ${thema.ueberschrift}
          </h3>
          <p style="margin: 0 0 10px; color: #374151; font-size: 14px; line-height: 1.6;">
            ${thema.zusammenfassung}
          </p>
          <p style="margin: 0; padding: 10px; background: #f3f4f6; border-radius: 6px; color: #6b7280; font-size: 13px; line-height: 1.5;">
            🎥 <em>${thema.visuelle_beschreibung}</em>
          </p>
        </td>
      </tr>`
    )
    .join("");

  const wetterHtml = summary.wetter
    ? `<tr>
        <td style="padding: 20px 0;">
          <h3 style="margin: 0 0 8px; color: #1a56db; font-size: 16px;">🌤️ Wetter</h3>
          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${summary.wetter}</p>
        </td>
      </tr>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff;">
    <tr>
      <td style="padding: 30px 24px 20px; background: linear-gradient(135deg, #003366 0%, #004d99 100%); text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">📺 Tagesschau</h1>
        <p style="margin: 6px 0 0; color: #93c5fd; font-size: 14px;">Zusammenfassung vom ${formatDatum(summary.datum)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="margin: 0 0 20px; padding: 16px; background: #eff6ff; border-left: 4px solid #1a56db; border-radius: 0 6px 6px 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
          ${summary.ueberblick}
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${themenHtml}
          ${wetterHtml}
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
          <tr>
            <td align="center">
              <a href="${summary.videoUrl}" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                ▶ Original-Video ansehen
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 12px;">
              <a href="${siteUrl}" style="display: inline-block; padding: 10px 20px; background: #1a56db; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px;">
                📄 Alle Zusammenfassungen
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px; background: #f3f4f6; text-align: center;">
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          Automatisch erstellt mit Gemini AI • ${summary.titel}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Formatiert ein ISO-Datum in deutsches Format.
 */
function formatDatum(isoDate: string): string {
  const date = new Date(isoDate + "T12:00:00");
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
