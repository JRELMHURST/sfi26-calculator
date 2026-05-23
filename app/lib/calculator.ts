import { SFI26_ACTIONS, ACTION_BY_CODE } from "../data/sfi26-actions";
import {
  CalculationResult,
  Farm,
  LandParcel,
  MissedOpportunity,
  PaymentLine,
  SFI26Action,
  SelectedAction,
  totalAgriculturalArea,
} from "./types";

const ANNUAL_CAP_GBP = 100_000;
const AREA_CAP_FRACTION = 0.25;

function actionEligibleForFarm(action: SFI26Action, farm: Farm): boolean {
  const matchingParcels = farm.parcels.filter((p) =>
    action.landTypes.includes(p.landType),
  );
  if (action.landTypes.length > 0 && matchingParcels.length === 0) return false;

  if (action.requiresLessSensitive) {
    if (!matchingParcels.some((p) => p.isLessSensitive)) return false;
  }
  if (action.requiresWatercourse) {
    if (!matchingParcels.some((p) => p.hasWatercourse)) return false;
  }
  if (action.requiresSDA === true) {
    if (!matchingParcels.some((p) => p.isSDA)) return false;
  }
  if (action.requiresSDA === false) {
    if (!matchingParcels.some((p) => !p.isSDA)) return false;
  }
  if (action.requiresPonds && farm.parcels.every((p) => p.pondCount === 0)) {
    return false;
  }
  if (action.requiresHedgerows && farm.hedgerowsM <= 0) return false;
  if (action.requiresDryStoneWalls && farm.dryStoneWallsM <= 0) return false;
  if (action.requiresEarthBanks && farm.earthBanksM <= 0) return false;
  if (action.requiresDitches && farm.ditchesM <= 0) return false;
  if (
    action.requiresTraditionalBuildings &&
    farm.traditionalBuildingsSqm <= 0
  ) {
    return false;
  }
  if (action.requiresHistoricFeatures && !farm.hasHistoricFeatures) return false;
  if (
    action.requiresPrecisionEquipment &&
    !farm.usesPrecisionFarming
  ) {
    return false;
  }
  if (action.organicRequirement === "converting_only") {
    if (farm.organicStatus !== "converting") return false;
  }
  if (action.organicRequirement === "certified_only") {
    if (farm.organicStatus !== "certified") return false;
  }
  return true;
}

export function getEligibleActions(farm: Farm): SFI26Action[] {
  return SFI26_ACTIONS.filter((a) => actionEligibleForFarm(a, farm));
}

export function maxQuantityForAction(
  action: SFI26Action,
  farm: Farm,
): number | undefined {
  const eligibleParcels = farm.parcels.filter((p) =>
    action.landTypes.includes(p.landType),
  );
  const eligibleArea = eligibleParcels.reduce((s, p) => s + p.areaHa, 0);

  switch (action.unit) {
    case "per_ha":
      return Math.max(0, eligibleArea);
    case "per_100m":
      if (action.requiresHedgerows) return farm.hedgerowsM;
      if (action.requiresDryStoneWalls) return farm.dryStoneWallsM;
      if (action.requiresEarthBanks) return farm.earthBanksM;
      if (action.requiresDitches) return farm.ditchesM;
      return undefined;
    case "per_pond":
      return farm.parcels.reduce((s, p) => s + p.pondCount, 0);
    case "per_plot":
      // 2 plots/ha (min) — we cap at a reasonable upper bound of ~5/ha
      return Math.round(eligibleArea * 5);
    case "per_tonne":
      // AHW2: max 1 tonne per 2ha of paired CAHL2
      return undefined;
    case "per_sq_m":
      return farm.traditionalBuildingsSqm;
  }
}

export function defaultQuantityForAction(
  action: SFI26Action,
  farm: Farm,
): number {
  const eligibleParcels = farm.parcels.filter((p) =>
    action.landTypes.includes(p.landType),
  );
  const eligibleArea = eligibleParcels.reduce((s, p) => s + p.areaHa, 0);
  switch (action.unit) {
    case "per_ha":
      // For area-capped actions default to a small allocation;
      // for everything else default to all eligible area.
      if (action.isAreaCapped) {
        return Math.round(Math.min(eligibleArea * 0.05, totalAgriculturalArea(farm) * 0.05) * 10) / 10;
      }
      return Math.round(eligibleArea * 10) / 10;
    case "per_100m":
      return maxQuantityForAction(action, farm) ?? 0;
    case "per_pond":
      return maxQuantityForAction(action, farm) ?? 0;
    case "per_plot":
      return Math.round(eligibleArea * 2);
    case "per_tonne":
      return Math.round(eligibleArea * 0.25 * 10) / 10;
    case "per_sq_m":
      return farm.traditionalBuildingsSqm;
  }
}

function suggestionQuantity(action: SFI26Action, farm: Farm): number {
  if (action.unit !== "per_ha") return defaultQuantityForAction(action, farm);
  const eligibleArea = farm.parcels
    .filter((p) => action.landTypes.includes(p.landType))
    .reduce((s, p) => s + p.areaHa, 0);
  if (action.isAreaCapped) {
    return Math.round(eligibleArea * 0.05 * 10) / 10;
  }
  return Math.round(eligibleArea * 0.1 * 10) / 10;
}

function rawPaymentForAction(action: SFI26Action, quantity: number): number {
  switch (action.unit) {
    case "per_ha":
    case "per_plot":
    case "per_pond":
    case "per_tonne":
    case "per_sq_m":
      return action.rate * quantity;
    case "per_100m":
      return action.rate * (quantity / 100);
  }
}

export function calculate(
  farm: Farm,
  selected: SelectedAction[],
): CalculationResult {
  const totalArea = totalAgriculturalArea(farm);
  const warnings: string[] = [];

  const enriched = selected
    .map((s) => {
      const action = ACTION_BY_CODE[s.code];
      return action && s.quantity > 0
        ? { action, quantity: s.quantity }
        : null;
    })
    .filter((x): x is { action: SFI26Action; quantity: number } => x !== null);

  // 25% area cap on per-hectare area-capped actions
  const areaCappedHa = enriched
    .filter((e) => e.action.isAreaCapped && e.action.unit === "per_ha")
    .reduce((s, e) => s + e.quantity, 0);

  const maxAreaCappedHa = totalArea * AREA_CAP_FRACTION;
  let areaCapScale = 1;
  const areaCapTriggered = areaCappedHa > maxAreaCappedHa && totalArea > 0;
  if (areaCapTriggered) {
    areaCapScale = maxAreaCappedHa / areaCappedHa;
    warnings.push(
      `Your area-capped action total (${areaCappedHa.toFixed(1)} ha) exceeds 25% of your land (${maxAreaCappedHa.toFixed(1)} ha max). Those actions have been scaled down.`,
    );
  }

  // Supplemental pairing validation
  for (const { action } of enriched) {
    if (
      action.isSupplemental &&
      action.baseActionCodes &&
      action.baseActionCodes.length > 0
    ) {
      const hasBase = enriched.some((e) =>
        action.baseActionCodes!.includes(e.action.code),
      );
      if (!hasBase) {
        warnings.push(
          `${action.code} is supplemental — pair it with ${action.baseActionCodes.join(" or ")} or it can't be claimed.`,
        );
      }
    }
  }

  // Per-ha and per-side max quantity checks
  for (const { action, quantity } of enriched) {
    if (action.unit === "per_ha") {
      const eligibleArea = farm.parcels
        .filter((p) => action.landTypes.includes(p.landType))
        .reduce((s, p) => s + p.areaHa, 0);
      if (quantity > eligibleArea + 0.001) {
        warnings.push(
          `${action.code} area (${quantity} ha) exceeds your eligible land for this action (${eligibleArea.toFixed(1)} ha).`,
        );
      }
    }
    if (action.unit === "per_tonne" && action.maxPerHa) {
      const pairedBaseHa = enriched
        .filter((e) => action.baseActionCodes?.includes(e.action.code))
        .reduce((s, e) => s + e.quantity, 0);
      const maxTonnes = pairedBaseHa * action.maxPerHa;
      if (quantity > maxTonnes + 0.001) {
        warnings.push(
          `${action.code} is limited to ${maxTonnes.toFixed(2)} tonnes based on your paired base action area.`,
        );
      }
    }
    if (action.unit === "per_pond" && action.maxPerHa) {
      const eligibleArea = farm.parcels
        .filter((p) => action.landTypes.includes(p.landType))
        .reduce((s, p) => s + p.areaHa, 0);
      const maxPonds = Math.floor(eligibleArea * action.maxPerHa);
      if (quantity > maxPonds) {
        warnings.push(
          `${action.code} is limited to ${maxPonds} ponds based on your eligible land.`,
        );
      }
    }
  }

  // Build breakdown
  let totalBeforeCaps = 0;
  let totalAfterAreaCap = 0;
  const breakdown: PaymentLine[] = enriched.map(({ action, quantity }) => {
    const effectiveQuantity =
      action.isAreaCapped && action.unit === "per_ha"
        ? quantity * areaCapScale
        : quantity;
    const base = rawPaymentForAction(action, quantity);
    const adjusted = rawPaymentForAction(action, effectiveQuantity);
    totalBeforeCaps += base;
    totalAfterAreaCap += adjusted;
    return {
      action,
      quantity,
      basePayment: Math.round(base),
      finalPayment: Math.round(adjusted),
      reduced: action.isAreaCapped && areaCapTriggered,
    };
  });

  const capped100k = totalAfterAreaCap > ANNUAL_CAP_GBP;
  const finalPayment = Math.min(totalAfterAreaCap, ANNUAL_CAP_GBP);
  if (capped100k) {
    warnings.push(
      `Your selections would total £${Math.round(totalAfterAreaCap).toLocaleString()} but are capped at the £100,000 annual limit.`,
    );
  }

  // Missed opportunities — eligible actions not selected, ranked by potential payment.
  // Use a conservative default (~10% of eligible area for per-ha land actions) so the
  // total isn't an unrealistic stacked figure.
  const selectedCodes = new Set(enriched.map((e) => e.action.code));
  const eligible = getEligibleActions(farm);
  const missed: MissedOpportunity[] = eligible
    .filter((a) => !selectedCodes.has(a.code) && !a.isSupplemental)
    .map((a) => {
      const suggestedQuantity = suggestionQuantity(a, farm);
      return {
        action: a,
        suggestedQuantity,
        estimatedPayment: Math.round(rawPaymentForAction(a, suggestedQuantity)),
      };
    })
    .filter((m) => m.estimatedPayment > 0)
    .sort((a, b) => b.estimatedPayment - a.estimatedPayment)
    .slice(0, 8);

  return {
    totalBeforeCaps: Math.round(totalBeforeCaps),
    totalAfterAreaCap: Math.round(totalAfterAreaCap),
    finalPayment: Math.round(finalPayment),
    threeYearTotal: Math.round(finalPayment * 3),
    capped100k,
    areaCapTriggered,
    areaCapMaxHa: Math.round(maxAreaCappedHa * 10) / 10,
    areaCapUsedHa: Math.round(areaCappedHa * 10) / 10,
    breakdown,
    warnings,
    missed,
    totalAgriculturalAreaHa: Math.round(totalArea * 10) / 10,
  };
}

export function emptyParcel(): LandParcel {
  return {
    id: cryptoRandomId(),
    landType: "arable",
    areaHa: 0,
    hasWatercourse: false,
    pondCount: 0,
    isSDA: false,
    isLessSensitive: false,
  };
}

export function emptyFarm(): Farm {
  return {
    parcels: [],
    hedgerowsM: 0,
    dryStoneWallsM: 0,
    earthBanksM: 0,
    ditchesM: 0,
    traditionalBuildingsSqm: 0,
    hasHistoricFeatures: false,
    organicStatus: "none",
    usesPrecisionFarming: false,
    hasExistingElm: false,
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
