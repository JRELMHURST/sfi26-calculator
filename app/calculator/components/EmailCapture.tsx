"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function EmailCapture({
  farmSizeHa,
  estimatedPayment,
  window,
}: {
  farmSizeHa: number;
  estimatedPayment: number;
  window: "window1" | "window2" | "ineligible" | null;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
          window,
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

      {status === "error" && errorMessage && (
        <p className="mt-3 text-sm text-red-700">{errorMessage}</p>
      )}
    </form>
  );
}
