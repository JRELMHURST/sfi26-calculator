import { NextResponse } from "next/server";

export const runtime = "edge";

type SubscribePayload = {
  email: string;
  marketingConsent: boolean;
  farmSizeHa?: number;
  estimatedPayment?: number;
  window?: "window1" | "window2" | "ineligible" | null;
};

const RESEND_BASE = "https://api.resend.com";

function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  // Conservative, RFC-5321-ish check — good enough for capture forms.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export async function POST(req: Request) {
  let body: SubscribePayload;
  try {
    body = (await req.json()) as SubscribePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidEmail(body.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const notifyTo = process.env.NOTIFY_EMAIL_TO;
  const notifyFrom = process.env.NOTIFY_EMAIL_FROM;

  if (!apiKey || !audienceId) {
    return NextResponse.json(
      { error: "Email capture not configured on the server." },
      { status: 503 },
    );
  }

  const email = body.email.trim().toLowerCase();
  const consent = !!body.marketingConsent;

  // 1. Add (or upsert) the contact to the Resend Audience.
  const addContactRes = await fetch(
    `${RESEND_BASE}/audiences/${audienceId}/contacts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        unsubscribed: !consent,
      }),
    },
  );

  // Resend returns 200 on success; 422 if the contact already exists.
  // Treat both as success for the user — they're on the list either way.
  if (!addContactRes.ok && addContactRes.status !== 422) {
    const text = await addContactRes.text().catch(() => "");
    console.error("Resend add-contact failed:", addContactRes.status, text);
    return NextResponse.json(
      { error: "Could not save email. Please try again." },
      { status: 502 },
    );
  }

  // 2. Best-effort notification email to JR with farm context.
  //    Failure here must not block the user-facing success path.
  if (notifyTo && notifyFrom) {
    const farmLine =
      body.farmSizeHa != null ? `${body.farmSizeHa} ha` : "(not provided)";
    const paymentLine =
      body.estimatedPayment != null
        ? `£${body.estimatedPayment.toLocaleString()}/yr`
        : "(not provided)";
    const windowLine =
      body.window === "window1"
        ? "Window 1 (June 2026)"
        : body.window === "window2"
          ? "Window 2 (September 2026)"
          : body.window === "ineligible"
            ? "Ineligible"
            : "(unknown)";

    const subject = `SFI26 lead: ${email}${body.estimatedPayment ? ` (£${body.estimatedPayment.toLocaleString()}/yr)` : ""}`;
    const text = [
      `New SFI26 calculator lead`,
      ``,
      `Email: ${email}`,
      `Marketing consent: ${consent ? "Yes" : "No"}`,
      `Farm size: ${farmLine}`,
      `Estimated annual payment: ${paymentLine}`,
      `Eligibility window: ${windowLine}`,
      ``,
      `Captured at: ${new Date().toISOString()}`,
    ].join("\n");

    try {
      await fetch(`${RESEND_BASE}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: notifyFrom,
          to: [notifyTo],
          subject,
          text,
          reply_to: email,
        }),
      });
    } catch (err) {
      console.error("Resend notify email failed (non-fatal):", err);
    }
  }

  return NextResponse.json({ ok: true });
}
