import { getDictionary, translate } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

/** Subject + HTML body for one outgoing email, built from the `email` i18n namespace. */
export interface EmailContent {
  subject: string;
  html: string;
}

function wrapHtml(heading: string, body: string, ctaHint: string, tagline: string, signoff: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background-color:#F5EEE6;font-family:Georgia,'Times New Roman',serif;color:#1C1917;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;">
      <tr><td>
        <p style="font-size:10px;letter-spacing:1.5px;color:#C4A096;text-transform:uppercase;margin:0 0 8px;">BabicADesigns</p>
        <h1 style="font-size:22px;color:#385048;margin:0 0 16px;">${heading}</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">${body}</p>
        <p style="font-size:13px;line-height:1.6;color:#6B6B63;margin:0 0 24px;">${ctaHint}</p>
        <p style="font-size:13px;font-style:italic;color:#6B6B63;margin:0 0 24px;">${signoff}</p>
        <p style="font-size:11px;color:#6B6B63;border-top:1px solid #E3D9C9;padding-top:12px;margin:0;">${tagline}</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Email for a fresh itinerary PDF send. */
export function buildItineraryEmail(tripTitle: string, durationDays: number, locale: Locale): EmailContent {
  const dictionary = getDictionary(locale);
  const t = (key: string, vars?: Record<string, string | number>) => translate(dictionary, "email", key, vars);
  return {
    subject: t("itinerary.subject", { tripTitle }),
    html: wrapHtml(
      t("itinerary.heading"),
      t("itinerary.body", { tripTitle, durationDays }),
      t("itinerary.ctaHint"),
      t("footer.tagline"),
      t("footer.signoff")
    ),
  };
}

/** Email for a "Resend" of a previously-sent itinerary PDF. */
export function buildResendItineraryEmail(tripTitle: string, locale: Locale): EmailContent {
  const dictionary = getDictionary(locale);
  const t = (key: string, vars?: Record<string, string | number>) => translate(dictionary, "email", key, vars);
  return {
    subject: t("resend.subject", { tripTitle }),
    html: wrapHtml(
      t("resend.heading"),
      t("resend.body", { tripTitle }),
      t("resend.ctaHint"),
      t("footer.tagline"),
      t("footer.signoff")
    ),
  };
}
