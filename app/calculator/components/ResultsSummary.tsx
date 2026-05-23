"use client";

import {
  CalculationResult,
  UNIT_LABELS,
  UNIT_QUANTITY_LABELS,
} from "../../lib/types";
import type { EligibilityResult } from "./EligibilityCheck";

export default function ResultsSummary({
  result,
  eligibility,
  onBack,
  onAddMissed,
  onStartOver,
}: {
  result: CalculationResult;
  eligibility: EligibilityResult | null;
  onBack: () => void;
  onAddMissed: (code: string, quantity: number) => void;
  onStartOver: () => void;
}) {
  return (
    <section>
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
        Your estimated SFI26 payment
      </p>
      <h1 className="mt-1 text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl">
        £{result.finalPayment.toLocaleString()}
        <span className="text-2xl font-medium text-stone-500"> /year</span>
      </h1>
      <p className="mt-2 text-stone-600">
        Over your 3-year agreement, that&rsquo;s approximately{" "}
        <strong className="text-stone-900">
          £{result.threeYearTotal.toLocaleString()}
        </strong>
        .
      </p>

      {eligibility?.window && eligibility.window !== "ineligible" && (
        <p className="mt-2 text-sm text-stone-500">
          Likely eligible for{" "}
          <strong>
            {eligibility.window === "window1"
              ? "Window 1 (opens June 2026)"
              : "Window 2 (opens September 2026)"}
          </strong>
          .
        </p>
      )}

      {(result.capped100k || result.areaCapTriggered) && (
        <div className="mt-4 space-y-2">
          {result.capped100k && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Your selections would total <strong>£{result.totalAfterAreaCap.toLocaleString()}</strong> but the £100,000 annual cap applies.
            </div>
          )}
          {result.areaCapTriggered && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Some area-capped actions were reduced to stay within 25% of your total agricultural area ({result.areaCapMaxHa} ha max).
            </div>
          )}
        </div>
      )}

      <h2 className="mt-10 text-xl font-semibold text-stone-900">Breakdown</h2>
      {result.breakdown.length === 0 ? (
        <p className="mt-3 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          No actions selected. Go back and pick some actions to see your payment.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-600">
              <tr>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2 text-right">Quantity</th>
                <th className="px-4 py-2 text-right">Annual payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {result.breakdown.map((line) => (
                <tr key={line.action.code}>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-stone-500">
                        {line.action.code}
                      </span>
                      <span className="font-medium text-stone-900">
                        {line.action.name}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      £{line.action.rate.toLocaleString()}{" "}
                      {UNIT_LABELS[line.action.unit]}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-stone-700">
                    {line.quantity}{" "}
                    <span className="text-xs text-stone-500">
                      {UNIT_QUANTITY_LABELS[line.action.unit]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-stone-900">
                    £{line.finalPayment.toLocaleString()}
                    {line.reduced &&
                      line.finalPayment !== line.basePayment && (
                        <span className="ml-1 text-xs text-amber-700">
                          (capped)
                        </span>
                      )}
                  </td>
                </tr>
              ))}
              <tr className="bg-stone-50 font-semibold text-stone-900">
                <td className="px-4 py-3" colSpan={2}>
                  Total annual payment
                </td>
                <td className="px-4 py-3 text-right">
                  £{result.finalPayment.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {result.missed.length > 0 && !result.capped100k && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-stone-900">
            Money you might be missing
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Top-ranked actions you&rsquo;re also eligible for — these
            suggestions use small example areas (~10% of your eligible land),
            so you can&rsquo;t simply stack all of them.
          </p>
          <ul className="mt-4 space-y-2">
            {result.missed.map((m) => (
              <li
                key={m.action.code}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-stone-200 bg-white px-4 py-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-stone-500">
                      {m.action.code}
                    </span>
                    <span className="font-medium text-stone-900">
                      {m.action.name}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Suggested: {m.suggestedQuantity}{" "}
                    {UNIT_QUANTITY_LABELS[m.action.unit]}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-emerald-700">
                    +£{m.estimatedPayment.toLocaleString()}/yr
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onAddMissed(m.action.code, m.suggestedQuantity)
                    }
                    className="rounded-md border border-emerald-700 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-700 hover:text-white"
                  >
                    Add
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 rounded-lg border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
        Reminder: this is an <strong>estimate</strong>, not financial advice.
        Always verify eligibility and payment amounts with the Rural Payments
        Agency before submitting your application.
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          ← Edit my actions
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Start over
        </button>
      </div>
    </section>
  );
}
