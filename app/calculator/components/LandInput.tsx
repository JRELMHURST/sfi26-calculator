"use client";

import { emptyParcel } from "../../lib/calculator";
import {
  Farm,
  LAND_TYPE_LABELS,
  LandParcel,
  LandType,
  OrganicStatus,
  totalAgriculturalArea,
} from "../../lib/types";
import type { EligibilityResult } from "./EligibilityCheck";

const LAND_TYPES: LandType[] = [
  "arable",
  "improved_grassland",
  "unimproved_grassland",
  "horticultural",
  "top_fruit",
  "moorland",
  "enclosed_rough_grazing",
];

export default function LandInput({
  farm,
  setFarm,
  eligibility,
  onBack,
  onContinue,
}: {
  farm: Farm;
  setFarm: (updater: (prev: Farm) => Farm) => void;
  eligibility: EligibilityResult | null;
  onBack: () => void;
  onContinue: () => void;
}) {
  const total = totalAgriculturalArea(farm);
  const canContinue = farm.parcels.length > 0 && total >= 3;

  function addParcel() {
    setFarm((f) => ({ ...f, parcels: [...f.parcels, emptyParcel()] }));
  }

  function updateParcel(id: string, patch: Partial<LandParcel>) {
    setFarm((f) => ({
      ...f,
      parcels: f.parcels.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  function removeParcel(id: string) {
    setFarm((f) => ({
      ...f,
      parcels: f.parcels.filter((p) => p.id !== id),
    }));
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
        Tell us about your land
      </h1>
      <p className="mt-2 text-stone-600">
        Add a card for each block of land. Doesn&rsquo;t need to be exact —
        you&rsquo;re building an estimate.
      </p>

      {eligibility?.window === "window1" && (
        <p className="mt-3 inline-block rounded-md bg-emerald-50 px-3 py-1 text-sm text-emerald-800">
          Window 1 — opens June 2026
        </p>
      )}

      <div className="mt-6 space-y-4">
        {farm.parcels.map((p, i) => (
          <ParcelCard
            key={p.id}
            index={i}
            parcel={p}
            onChange={(patch) => updateParcel(p.id, patch)}
            onRemove={() => removeParcel(p.id)}
          />
        ))}
        <button
          type="button"
          onClick={addParcel}
          className="w-full rounded-lg border-2 border-dashed border-stone-300 bg-white px-4 py-6 text-center text-stone-600 transition hover:border-emerald-500 hover:text-emerald-700"
        >
          + Add a land parcel
        </button>
      </div>

      <div className="mt-4 rounded-lg bg-stone-100 px-4 py-3 text-sm">
        <strong className="text-stone-900">Total land:</strong>{" "}
        <span className="text-stone-700">{total.toFixed(1)} ha</span>
        {total > 0 && total < 3 && (
          <span className="ml-2 text-amber-700">
            (You need at least 3 ha for SFI26)
          </span>
        )}
      </div>

      <h2 className="mt-10 text-xl font-semibold text-stone-900">
        A few farm-level questions
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Optional, but these unlock more SFI26 actions for you.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Hedgerow length (metres)"
          help="Total hedgerow on your farm. Tip: SFI typically pays per side, so 1 km of hedge with both sides on your land = 2,000 m of paid side."
          value={farm.hedgerowsM}
          onChange={(v) => setFarm((f) => ({ ...f, hedgerowsM: v }))}
        />
        <NumberField
          label="Dry stone walls (metres)"
          value={farm.dryStoneWallsM}
          onChange={(v) => setFarm((f) => ({ ...f, dryStoneWallsM: v }))}
        />
        <NumberField
          label="Earth banks / hedgebanks (metres)"
          value={farm.earthBanksM}
          onChange={(v) => setFarm((f) => ({ ...f, earthBanksM: v }))}
        />
        <NumberField
          label="Ditches (metres)"
          value={farm.ditchesM}
          onChange={(v) => setFarm((f) => ({ ...f, ditchesM: v }))}
        />
        <NumberField
          label="Traditional farm buildings (sq m)"
          value={farm.traditionalBuildingsSqm}
          onChange={(v) =>
            setFarm((f) => ({ ...f, traditionalBuildingsSqm: v }))
          }
        />
      </div>

      <div className="mt-6 space-y-3">
        <ToggleRow
          label="Do you have historic or archaeological features on grassland?"
          value={farm.hasHistoricFeatures}
          onChange={(v) => setFarm((f) => ({ ...f, hasHistoricFeatures: v }))}
        />
        <ToggleRow
          label="Do you use precision farming equipment (VRA, sensor-guided spraying, robotic weeding)?"
          value={farm.usesPrecisionFarming}
          onChange={(v) => setFarm((f) => ({ ...f, usesPrecisionFarming: v }))}
        />
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm font-medium text-stone-900">
            Are you organic certified or converting?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {([
              ["none", "Not organic"],
              ["converting", "Converting"],
              ["certified", "Certified organic"],
            ] as [OrganicStatus, string][]).map(([val, lab]) => {
              const active = farm.organicStatus === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFarm((f) => ({ ...f, organicStatus: val }))}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  {lab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="rounded-lg bg-emerald-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Continue — pick your actions →
        </button>
      </div>
    </section>
  );
}

function ParcelCard({
  index,
  parcel,
  onChange,
  onRemove,
}: {
  index: number;
  parcel: LandParcel;
  onChange: (patch: Partial<LandParcel>) => void;
  onRemove: () => void;
}) {
  const isLessSensitiveEligible =
    parcel.landType === "arable" ||
    parcel.landType === "improved_grassland" ||
    parcel.landType === "unimproved_grassland";

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-stone-900">
          Parcel {index + 1}
        </h3>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-stone-500 hover:text-red-600"
        >
          Remove
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Land type</span>
          <select
            value={parcel.landType}
            onChange={(e) =>
              onChange({ landType: e.target.value as LandType })
            }
            className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {LAND_TYPES.map((t) => (
              <option key={t} value={t}>
                {LAND_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Area (hectares)
          </span>
          <input
            type="number"
            min={0}
            step={0.1}
            inputMode="decimal"
            value={parcel.areaHa || ""}
            onChange={(e) =>
              onChange({ areaHa: parseFloat(e.target.value) || 0 })
            }
            className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="e.g. 25"
          />
          <span className="mt-1 block text-xs text-stone-500">
            1 hectare ≈ 2.47 acres
          </span>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ToggleRow
          label="Borders a watercourse"
          value={parcel.hasWatercourse}
          onChange={(v) => onChange({ hasWatercourse: v })}
          compact
        />
        <ToggleRow
          label="In a Severely Disadvantaged Area (SDA)"
          value={parcel.isSDA}
          onChange={(v) => onChange({ isSDA: v })}
          compact
        />
        <label className="flex items-center justify-between rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
          <span className="text-sm text-stone-700">Ponds on this parcel</span>
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={parcel.pondCount || ""}
            onChange={(e) =>
              onChange({ pondCount: parseInt(e.target.value) || 0 })
            }
            className="w-20 rounded border border-stone-300 px-2 py-1 text-right text-sm"
            placeholder="0"
          />
        </label>
        {isLessSensitiveEligible && (
          <ToggleRow
            label="“Less sensitive” land (eligible for agroforestry)"
            value={parcel.isLessSensitive}
            onChange={(v) => onChange({ isLessSensitive: v })}
            compact
          />
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block rounded-lg border border-stone-200 bg-white p-4">
      <span className="block text-sm font-medium text-stone-700">{label}</span>
      <input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value || ""}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="mt-2 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        placeholder="0"
      />
      {help && <span className="mt-1 block text-xs text-stone-500">{help}</span>}
    </label>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md border border-stone-200 ${
        compact ? "bg-stone-50 px-3 py-2" : "bg-white p-4"
      }`}
    >
      <span className="text-sm text-stone-800">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
          value ? "bg-emerald-600" : "bg-stone-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 translate-y-0.5 transform rounded-full bg-white shadow transition ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
