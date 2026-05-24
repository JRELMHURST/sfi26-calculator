"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type Status = "idle" | "submitting" | "success" | "error";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Cloudflare Turnstile global, declared loosely — the package isn't typed.
type TurnstileGlobal = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      appearance?: "always" | "execute" | "interaction-only";
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileGlobal;
  }
}

export default function EmailCapture({
  farmSizeHa,
  estimatedPayment,
  window: eligibilityWindow,
}: {
  farmSizeHa: number;
  estimatedPayment: number;
  window: "window1" | "window2" | "ineligible" | null;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [companyHoneypot, setCompanyHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Render Turnstile widget once the script has loaded and the container is mounted.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    function tryRender() {
      if (cancelled) return;
      if (!widgetContainerRef.current || !window.turnstile) {
        requestAnimationFrame(tryRender);
        return;
      }
      if (widgetIdRef.current !== null) return; // already rendered
      widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY!,
        callback: (token) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(null),
        "error-callback": () => setTurnstileToken(null),
        appearance: "interaction-only",
      });
    }
    tryRender();
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (companyHoneypot) {
      // Silently swallow bot submissions. Show success so they don't retry.
      setStatus("success");
      return;
    }
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          marketingConsent: consent,
          farmSizeHa,
          estimatedPayment,
          window: eligibilityWindow,
          turnstileToken,
          company: companyHoneypot,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      // Reset Turnstile so the user can retry without a stale token.
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
          setTurnstileToken(null);
        } catch {
          // ignore
        }
      }
    }
  }

  if (status === "success") {
    return (
      <div className="mt-10 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-emerald-900">
          You&rsquo;re on the list ✓
        </h2>
        <p className="mt-2 text-sm text-emerald-900">
          Your estimate is saved. We&rsquo;ll let you know when Window 1 opens
          and share tips for getting the most from SFI26.
        </p>
      </div>
    );
  }

  return (
    <>
      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="lazyOnload"
        />
      )}
      <form
        onSubmit={handleSubmit}
        className="mt-10 rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-stone-900">
          Save your estimate
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Pop your email in and we&rsquo;ll send your estimate plus a heads-up
          when SFI26 Window 1 opens. No spam, unsubscribe anytime.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full flex-1 rounded-md border border-stone-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            disabled={status === "submitting"}
          />
          <button
            type="submit"
            disabled={status === "submitting" || !email}
            className="shrink-0 rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {status === "submitting" ? "Saving…" : "Save my estimate"}
          </button>
        </div>

        {/* Honeypot — invisible to humans, irresistible to dumb bots. */}
        <div
          aria-hidden="true"
          className="absolute h-0 w-0 overflow-hidden opacity-0"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        >
          <label htmlFor="ec-company">Company (leave blank)</label>
          <input
            id="ec-company"
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={companyHoneypot}
            onChange={(e) => setCompanyHoneypot(e.target.value)}
          />
        </div>

        <label className="mt-3 flex items-start gap-2 text-xs text-stone-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
            disabled={status === "submitting"}
          />
          <span>
            Yes, send me occasional SFI26 tips and updates from JR Data Solutions.
            I can unsubscribe anytime.
          </span>
        </label>

        <p className="mt-3 text-[11px] leading-snug text-stone-500">
          We only use your email to send you what you ask for. We don&rsquo;t
          share or sell your details. By submitting, you agree we can store
          your email and basic farm details for this purpose.
        </p>

        {/* Cloudflare Turnstile widget container.
            appearance="interaction-only" keeps it invisible unless a
            challenge is required, so most users never see it. */}
        {TURNSTILE_SITE_KEY && (
          <div ref={widgetContainerRef} className="mt-3" />
        )}

        {status === "error" && errorMessage && (
          <p className="mt-3 text-sm text-red-700">{errorMessage}</p>
        )}
      </form>
    </>
  );
}
