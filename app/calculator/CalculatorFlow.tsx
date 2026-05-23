"use client";

import { useMemo, useState } from "react";
import { calculate, emptyFarm } from "../lib/calculator";
import type { Farm, SelectedAction } from "../lib/types";
import EligibilityCheck, { EligibilityResult } from "./components/EligibilityCheck";
import LandInput from "./components/LandInput";
import ActionSelector from "./components/ActionSelector";
import ResultsSummary from "./components/ResultsSummary";

type Step = "eligibility" | "land" | "actions" | "results";

const STEPS: { id: Step; label: string }[] = [
  { id: "eligibility", label: "Eligibility" },
  { id: "land", label: "Your land" },
  { id: "actions", label: "Pick actions" },
  { id: "results", label: "Your payment" },
];

export default function CalculatorFlow() {
  const [step, setStep] = useState<Step>("eligibility");
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [farm, setFarm] = useState<Farm>(emptyFarm);
  const [selected, setSelected] = useState<SelectedAction[]>([]);

  const result = useMemo(() => calculate(farm, selected), [farm, selected]);
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-full bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <a href="/" className="text-lg font-semibold tracking-tight text-emerald-800">
            SFI26 Calculator
          </a>
          <span className="text-xs text-stone-500">
            Estimates only — not financial advice
          </span>
        </div>
      </header>

      <nav className="border-b border-stone-200 bg-white">
        <ol className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto px-4 py-3 text-sm">
          {STEPS.map((s, i) => {
            const isCurrent = s.id === step;
            const isDone = i < currentStepIndex;
            return (
              <li key={s.id} className="flex items-center gap-2 whitespace-nowrap">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isCurrent
                      ? "bg-emerald-700 text-white"
                      : isDone
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={
                    isCurrent
                      ? "font-semibold text-stone-900"
                      : isDone
                        ? "text-stone-700"
                        : "text-stone-500"
                  }
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="ml-2 text-stone-300">→</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8 pb-24">
        {step === "eligibility" && (
          <EligibilityCheck
            onContinue={(r) => {
              setEligibility(r);
              setFarm((f) => ({ ...f, hasExistingElm: r.hasExistingElm }));
              setStep("land");
            }}
          />
        )}
        {step === "land" && (
          <LandInput
            farm={farm}
            setFarm={setFarm}
            eligibility={eligibility}
            onBack={() => setStep("eligibility")}
            onContinue={() => setStep("actions")}
          />
        )}
        {step === "actions" && (
          <ActionSelector
            farm={farm}
            selected={selected}
            setSelected={setSelected}
            result={result}
            onBack={() => setStep("land")}
            onContinue={() => setStep("results")}
          />
        )}
        {step === "results" && (
          <ResultsSummary
            result={result}
            eligibility={eligibility}
            onBack={() => setStep("actions")}
            onAddMissed={(code, quantity) => {
              setSelected((prev) => {
                if (prev.find((s) => s.code === code)) return prev;
                return [...prev, { code, quantity }];
              });
              setStep("actions");
            }}
            onStartOver={() => {
              setEligibility(null);
              setFarm(emptyFarm());
              setSelected([]);
              setStep("eligibility");
            }}
          />
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 text-xs text-stone-500">
          Based on official DEFRA / RPA SFI26 data published May 2026. Not
          affiliated with DEFRA or the RPA. Estimates only — always verify
          eligibility and payment with the Rural Payments Agency before applying.
          <span className="block pt-2 text-stone-400">
            Built by JR Data Solutions.
          </span>
        </div>
      </footer>
    </div>
  );
}
