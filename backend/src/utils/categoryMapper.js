export const mapLabelToCategory = (label) => {
  if (!label) return "BRAND_PERCEPTION";

  const normalized = label.toLowerCase().trim();

  if (normalized.includes("side")) return "SIDE_EFFECTS";
  if (normalized.includes("trial")) return "CLINICAL_TRIALS";
  if (normalized.includes("regulation")) return "REGULATION_POLICY";
  if (normalized.includes("competitor")) return "COMPETITOR_ACTIVITY";
  if (normalized.includes("marketing")) return "MARKETING_PROMOTION";
  if (normalized.includes("brand")) return "BRAND_PERCEPTION";

  // safe fallback
  return "BRAND_PERCEPTION";
};
