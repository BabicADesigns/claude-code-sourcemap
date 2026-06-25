/**
 * Email delivery — architecture only until RESEND_API_KEY / EMAIL_FROM_ADDRESS are set,
 * the same "real code behind a configured-check, safe fallback otherwise" pattern as
 * lib/ai/itinerary.ts's OpenAI gate (see docs/production-readiness.md). Talks to Resend's
 * plain REST API via fetch — no SDK dependency needed for one POST.
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM_ADDRESS);
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  attachment?: EmailAttachment;
}

export type SendEmailResult = { sent: true } | { sent: false; error: string };

/** Sends one email via Resend. Returns a friendly, never-thrown error when unconfigured or when the API call fails. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM_ADDRESS,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        attachments: input.attachment
          ? [{ filename: input.attachment.filename, content: input.attachment.content.toString("base64") }]
          : undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { sent: false, error: `Resend API error (${response.status}): ${body.slice(0, 300)}` };
    }

    return { sent: true };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : String(error) };
  }
}
