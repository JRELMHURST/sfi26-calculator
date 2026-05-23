"use client";

import { useMemo, useState } from "react";
import {
  defaultQuantityForAction,
  getEligibleActions,
  maxQuantityForAction,
} from "../../lib/calculator";
import {
  ActionCategory,
  CATEGORY_LABELS,
  CalculationResult,
  Farm,
  SFI26Action,
  SelectedAction,
  UNIT_LABELS,
  UNIT_QUANTITY_LABELS,
} from "../../lib/types";

export default function ActionSelector({
  farm,
  selected,
  setSelected,
  result,
  onBack,
  onContinue,
}: {
  farm: Farm;
  selected: SelectedAction[];
  setSelected: (
    updater: (prev: SelectedAction[]) => SelectedAction[],
  ) => void;
  result: CalculationResult;
  onBack: () => void;
  onContinue: () => void;
}) {
  const eligible = useMemo(() => getEligibleActions(farm), [farm]);

  const grouped = useMemo(() => {
    const g = new Map<ActionCategory, SFI26Action[]>();
    for (const a of eligible) {
      const arr = g.get(a.category) ?? [];
      arr.push(a);
      g.set(a.category, arr);
    }
    return Array.from(g.entries());
  }, [eligible]);

  const selectedMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of selected) m.set(s.code, s.quantity);
    return m;
  }, [selected]);

  function toggleAction(action: SFI26Action) {
    const isOn = selectedMap.has(action.code);
    if (isOn) {
      setSelected((prev) => prev.filter((s) => s.code !== action.code));
    } else {
      const q = defaultQuantityForAction(action, farm);
      setSelected((prev) => [...prev, { code: action.code, quantity: q }]);
    }
  }

  function updateQuantity(code: string, quantity: number) {
    setSelected((prev) =>
      prev.map((s) => (s.code === code ? { ...s, quantity } : s)),
    );
  }

  const [openCategory, setOpenCategory] = useState<ActionCategory | null>(
    grouped[0]?.[0] ?? null,
  );

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
        Pick the actions you want to do
      </h1>
      <p className="mt-2 text-stone-600">
        We&rsquo;ve filtered to {eligible.length}
        {" "}actions your land is eligible for. Toggle the ones you&rsquo;re
        already doing or willing to do — quantities pre-fill but you can edit
        them.
      </p>

      <div className="sticky top-0 z-10 -mx-4 mt-6 border-y border-emerald-100 bg-emerald-50 px-4 py-3 sm:mx-0 sm:rounded-lg">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-800">
              Running estimate
            </p>
            <p className="text-2xl font-bold text-emerald-900">
              £{result.finalPayment.toLocaleString()}
              <span className="ml-2 text-sm font-normal text-emerald-800">
                /year
              </span>
            </p>
          </div>
          <div className="text-right text-xs text-emerald-800">
            <div>
              Area-capped: {result.areaCapUsedHa} / {result.areaCapMaxHa} ha (25% cap)
            </div>
            {result.capped100k && (
              <div className="font-semibold text-amber-700">
                Capped at £100,000 annual limit
              </div>
            )}
          </div>
        </div>
        {result.warnings.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-amber-900">
            {result.warnings.map((w, i) => (
              <li key={i}>⚠ {w}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {grouped.map(([category, actions]) => {
          const open = openCategory === category;
          const selectedCount = actions.filter((a) =>
            selectedMap.has(a.code),
          ).length;
          return (
            <div
              key={category}
              className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenCategory(open ? null : category)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-stone-50"
              >
                <span className="font-semibold text-stone-900">
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="flex items-center gap-3 text-sm text-stone-600">
                  <span>
                    {actions.length} action{actions.length === 1 ? "" : "s"}
                    {selectedCount > 0 && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        {selectedCount} selected
                      </span>
                    )}
                  </span>
                  <span className="text-stone-400">{open ? "▾" : "▸"}</span>
                </span>
              </button>
              {open && (
                <div className="divide-y divide-stone-100 border-t border-stone-100">
                  {actions.map((a) => (
                    <ActionRow
                      key={a.code}
                      action={a}
                      farm={farm}
                      isSelected={selectedMap.has(a.code)}
                      quantity={selectedMap.get(a.code) ?? 0}
                      onToggle={() => toggleAction(a)}
                      onQuantityChange={(q) => updateQuantity(a.code, q)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          ← Back to land
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-lg bg-emerald-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          See my full estimate →
        </button>
      </div>
    </section>
  );
}

function ActionRow({
  action,
  farm,
  isSelected,
  quantity,
  onToggle,
  onQuantityChange,
}: {
  action: SFI26Action;
  farm: Farm;
  isSelected: boolean;
  quantity: number;
  onToggle: () => void;
  onQuantityChange: (q: number) => void;
}) {
  const max = maxQuantityForAction(action, farm);
  const ratePerYear =
    action.unit === "per_100m"
      ? action.rate * (quantity / 100)
      : action.rate * quantity;

  return (
    <div
      className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between ${
        isSelected ? "bg-emerald-50/40" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mt-1 h-5 w-5 cursor-pointer rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-stone-500">
              {action.code}
            </span>
            <span className="font-semibold text-stone-900">{action.name}</span>
            {action.recommended && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                Recommended
              </span>
            )}
            {action.isAreaCapped && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                25% cap
              </span>
            )}
            {action.isSupplemental && (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                Supplemental
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-stone-600">{action.description}</p>
          <p className="mt-1 text-xs text-stone-500">
            £{action.rate.toLocaleString()} {UNIT_LABELS[action.unit]}
            {action.previousRate && action.previousRate !== action.rate && (
              <span className="ml-1 text-stone-400">
                (was £{action.previousRate.toLocaleString()})
              </span>
            )}
          </p>
        </div>
      </div>
      {isSelected && (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={action.unit === "per_100m" ? 50 : 0.1}
              inputMode="decimal"
              value={quantity || ""}
              onChange={(e) =>
                onQuantityChange(parseFloat(e.target.value) || 0)
              }
              className="w-24 rounded-md border border-stone-300 px-2 py-1 text-right text-sm"
              placeholder="0"
            />
            <span className="text-xs text-stone-600">
              {UNIT_QUANTITY_LABELS[action.unit]}
            </span>
          </div>
          {max !== undefined && quantity > max && (
            <span className="text-xs text-amber-700">
              Max {max} for your farm
            </span>
          )}
          <span className="text-sm font-semibold text-emerald-800">
            £{Math.round(ratePerYear).toLocaleString()}/yr
          </span>
        </div>
      )}
    </div>
  );
}
