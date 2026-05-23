"use client";

import { useState } from "react";

export type EligibilityResult = {
  hasMinArea: boolean;
  isSmallFarm: boolean | null;
  hasExistingElm: boolean;
  window: "window1" | "window2" | "ineligible";
};

type Tri = "yes" | "no" | "unsure" | null;

export default function EligibilityCheck({
  onContinue,
}: {
  onContinue: (r: EligibilityResult) => void;
}) {
  const [hasMinArea, setHasMinArea] = useState<Tri>(null);
  const [smallFarm, setSmallFarm] = useState<Tri>(null);
  const [hasElm, setHasElm] = useState<Tri>(null);

  const ready =
    hasMinArea !== null && smallFarm !== null && hasElm !== null;

  const ineligible = hasMinArea === "no";

  function handleContinue() {
    if (!ready) return;
    const isSmall = smallFarm === "yes" ? true : smallFarm === "no" ? false : null;
    const hasElmBool = hasElm === "yes";
    let window: EligibilityResult["window"] = "window2";
    if (hasMinArea === "no") window = "ineligible";
    else if (isSmall === true || !hasElmBool) window = "window1";
    onContinue({
      hasMinArea: hasMinArea === "yes",
      isSmallFarm: isSmall,
      hasExistingElm: hasElmBool,
      window,
    });
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
        First, a quick eligibility check
      </h1>
      <p className="mt-2 text-stone-600">
        Three questions to confirm you can apply for SFI26 — and which window
        opens first for you.
      </p>

      <div className="mt-8 space-y-6">
        <Question
          label="Do you have at least 3 hectares of agricultural land registered with the RPA in England?"
          value={hasMinArea}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          onChange={setHasMinArea}
        />
        <Question
          label="Is your total agricultural area 50 hectares or less?"
          value={smallFarm}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "unsure", label: "Not sure" },
          ]}
          onChange={setSmallFarm}
        />
        <Question
          label="Do you currently have an SFI, CS Mid Tier, CS Higher Tier or HLS agreement?"
          value={hasElm}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "unsure", label: "Not sure" },
          ]}
          onChange={setHasElm}
        />
      </div>

      {ineligible && (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Sorry — SFI26 needs at least 3 hectares.</strong> You may
          still be eligible for Countryside Stewardship capital grants. You
          can still try the calculator to see what it could pay for you above
          3 ha.
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!ready}
          className="rounded-lg bg-emerald-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Continue to enter your land →
        </button>
        {ready && !ineligible && (
          <p className="text-sm text-stone-600">
            You&rsquo;re likely eligible for{" "}
            <strong>
              {smallFarm === "yes" || hasElm === "no"
                ? "Window 1 (opens June 2026)"
                : "Window 2 (opens September 2026)"}
            </strong>
            .
          </p>
        )}
      </div>
    </section>
  );
}

function Question({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Tri;
  options: { value: Tri; label: string }[];
  onChange: (v: Tri) => void;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-base font-medium text-stone-900">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              type="button"
              key={o.label}
              onClick={() => onChange(o.value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
