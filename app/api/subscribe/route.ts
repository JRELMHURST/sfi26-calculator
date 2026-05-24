import { NextResponse } from "next/server";

export const runtime = "edge";

type SubscribePayload = {
  email: string;
  marketingConsent: boolean;
  farmSizeHa?: number;
  estimatedPayment?: number;
  window?: "window1" | "window2" | "ineligible" | null;
  // Bot-defence fields:
  company?: string; // honeypot — must be empty
  turnstileToken?: string | null;
};

const RESEND_BASE = "https://api.resend.com";
const NOTION_BASE = "https://api.notion.com";
const NOTION_VERSION = "2022-06-28";
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp: string | null,
): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // No secret configured (e.g. local dev / preview) — skip verification.
    return { ok: true, reason: "no-secret" };
  }
  if (!token) return { ok: false, reason: "missing-token" };

  const form = new URLSearchParams();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteIp) form.append("remoteip", remoteIp);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const data = (await res.json().catch(() => null)) as
      | { success?: boolean; "error-codes"?: string[] }
      | null;
    if (!data || !data.success) {
      return {
        ok: false,
        reason: data?.["error-codes"]?.join(",") ?? "verify-failed",
      };
    }
    return { ok: true };
  } catch (err) {
    console.error("Turnstile verify threw:", err);
    return { ok: false, reason: "verify-threw" };
  }
}

function windowToNotionSelect(
  w: SubscribePayload["window"],
): "Window 1" | "Window 2" | "Ineligible" | "Unknown" {
  if (w === "window1") return "Window 1";
  if (w === "window2") return "Window 2";
  if (w === "ineligible") return "Ineligible";
  return "Unknown";
}

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

  // Honeypot: real users never fill this. Bots almost always do.
  // Return 200 OK silently so the bot doesn't retry or learn it's been caught.
  if (typeof body.company === "string" && body.company.trim().length > 0) {
    console.warn("Honeypot triggered for", body.email);
    return NextResponse.json({ ok: true });
  }

  if (!isValidEmail(body.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Cloudflare Turnstile bot check. Skipped if no secret configured (local dev).
  const remoteIp =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const verify = await verifyTurnstile(body.turnstileToken, remoteIp);
  if (!verify.ok) {
    console.warn("Turnstile rejected:", verify.reason, "for", body.email);
    return NextResponse.json(
      { error: "Bot check failed. Please refresh and try again." },
      { status: 403 },
    );
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

  // 3. Best-effort write to Notion leads database for structured triage.
  //    Failure here must not block the user-facing success path.
  const notionToken = process.env.NOTION_TOKEN;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;
  if (notionToken && notionDatabaseId) {
    const properties: Record<string, unknown> = {
      Email: { title: [{ text: { content: email } }] },
      "Marketing consent": { checkbox: consent },
      Window: { select: { name: windowToNotionSelect(body.window) } },
      Status: { select: { name: "New" } },
    };
    if (body.farmSizeHa != null) {
      properties["Farm size (ha)"] = { number: body.farmSizeHa };
    }
    if (body.estimatedPayment != null) {
      properties["Estimated payment"] = { number: body.estimatedPayment };
    }

    try {
      const notionRes = await fetch(`${NOTION_BASE}/v1/pages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: { database_id: notionDatabaseId },
          properties,
        }),
      });
      if (!notionRes.ok) {
        const text = await notionRes.text().catch(() => "");
        console.error("Notion write failed (non-fatal):", notionRes.status, text);
      }
    } catch (err) {
      console.error("Notion write threw (non-fatal):", err);
    }
  }

  return NextResponse.json({ ok: true });
}
