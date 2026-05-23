export type LandType =
  | "arable"
  | "improved_grassland"
  | "unimproved_grassland"
  | "horticultural"
  | "top_fruit"
  | "moorland"
  | "enclosed_rough_grazing";

export const LAND_TYPE_LABELS: Record<LandType, string> = {
  arable: "Arable land",
  improved_grassland: "Improved grassland",
  unimproved_grassland: "Unimproved grassland",
  horticultural: "Horticultural land",
  top_fruit: "Top fruit / orchards",
  moorland: "Moorland",
  enclosed_rough_grazing: "Enclosed rough grazing",
};

export type ActionCategory =
  | "agroforestry"
  | "boundary"
  | "buffer_strip"
  | "wildlife_arable"
  | "wildlife_grassland"
  | "heritage"
  | "ipm"
  | "moorland"
  | "nutrient_management"
  | "organic"
  | "precision_farming"
  | "soil_health"
  | "species_management"
  | "waterbodies";

export const CATEGORY_LABELS: Record<ActionCategory, string> = {
  agroforestry: "Agroforestry",
  boundary: "Boundary features",
  buffer_strip: "Buffer strips",
  wildlife_arable: "Farmland wildlife — arable & horticultural",
  wildlife_grassland: "Farmland wildlife — grassland",
  heritage: "Heritage",
  ipm: "Integrated pest management",
  moorland: "Moorland",
  nutrient_management: "Nutrient management",
  organic: "Organic",
  precision_farming: "Precision farming",
  soil_health: "Soil health",
  species_management: "Species management",
  waterbodies: "Waterbodies",
};

export type PaymentUnit =
  | "per_ha"
  | "per_100m"
  | "per_plot"
  | "per_pond"
  | "per_tonne"
  | "per_sq_m";

export const UNIT_LABELS: Record<PaymentUnit, string> = {
  per_ha: "/ha",
  per_100m: "/100m",
  per_plot: "/plot",
  per_pond: "/pond",
  per_tonne: "/tonne",
  per_sq_m: "/sq m",
};

export const UNIT_QUANTITY_LABELS: Record<PaymentUnit, string> = {
  per_ha: "hectares",
  per_100m: "metres",
  per_plot: "plots",
  per_pond: "ponds",
  per_tonne: "tonnes",
  per_sq_m: "sq m",
};

export type OrganicStatus = "none" | "converting" | "certified";

export interface SFI26Action {
  code: string;
  name: string;
  category: ActionCategory;
  rate: number;
  unit: PaymentUnit;
  paymentSide?: "one_side" | "both_sides";
  landTypes: LandType[];
  isSupplemental: boolean;
  baseActionCodes?: string[];
  isAreaCapped: boolean;
  isRotational: boolean;
  organicRequirement?: "none" | "converting_only" | "certified_only";
  requiresSDA?: boolean | null;
  requiresWatercourse: boolean;
  requiresHedgerows?: boolean;
  requiresDryStoneWalls?: boolean;
  requiresEarthBanks?: boolean;
  requiresPonds?: boolean;
  requiresDitches?: boolean;
  requiresTraditionalBuildings?: boolean;
  requiresHistoricFeatures?: boolean;
  requiresLessSensitive?: boolean;
  requiresPrecisionEquipment?: boolean;
  maxPerHa?: number;
  minPerHa?: number;
  description: string;
  whatYouMustDo: string;
  previousRate?: number;
  recommended?: boolean;
}

export interface LandParcel {
  id: string;
  landType: LandType;
  areaHa: number;
  hasWatercourse: boolean;
  pondCount: number;
  isSDA: boolean;
  isLessSensitive: boolean;
}

export interface Farm {
  parcels: LandParcel[];
  hedgerowsM: number;
  dryStoneWallsM: number;
  earthBanksM: number;
  ditchesM: number;
  traditionalBuildingsSqm: number;
  hasHistoricFeatures: boolean;
  organicStatus: OrganicStatus;
  usesPrecisionFarming: boolean;
  hasExistingElm: boolean;
}

export interface SelectedAction {
  code: string;
  quantity: number;
}

export interface PaymentLine {
  action: SFI26Action;
  quantity: number;
  basePayment: number;
  finalPayment: number;
  reduced: boolean;
}

export interface MissedOpportunity {
  action: SFI26Action;
  suggestedQuantity: number;
  estimatedPayment: number;
}

export interface CalculationResult {
  totalBeforeCaps: number;
  totalAfterAreaCap: number;
  finalPayment: number;
  threeYearTotal: number;
  capped100k: boolean;
  areaCapTriggered: boolean;
  areaCapMaxHa: number;
  areaCapUsedHa: number;
  breakdown: PaymentLine[];
  warnings: string[];
  missed: MissedOpportunity[];
  totalAgriculturalAreaHa: number;
}

export function totalAgriculturalArea(farm: Farm): number {
  return farm.parcels.reduce((sum, p) => sum + (p.areaHa || 0), 0);
}
