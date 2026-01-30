// backend/src/services/fetchers/clinical-trials.fetcher.js
import axios from "axios";

/**
 * Fetch recent clinical trial updates from ClinicalTrials.gov API
 * Uses the new API v2: https://clinicaltrials.gov/api/v2/studies
 */
export async function fetchClinicalTrials() {
  console.log("🔬 Fetching clinical trials data...");

  try {
    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (date) => {
      return date.toISOString().split("T")[0]; // YYYY-MM-DD
    };

    // ClinicalTrials.gov API v2 endpoint
    const baseUrl = "https://clinicaltrials.gov/api/v2/studies";

    const params = {
      "query.term": "pharma OR pharmaceutical OR drug OR medicine",
      "filter.advanced": `AREA[LastUpdatePostDate]RANGE[${formatDate(startDate)}, ${formatDate(endDate)}]`,
      fields:
        "NCTId,BriefTitle,BriefSummary,Condition,InterventionName,Phase,OverallStatus",
      pageSize: 50,
    };

    console.log(
      `  📅 Fetching trials updated between ${formatDate(startDate)} and ${formatDate(endDate)}`,
    );

    const response = await axios.get(baseUrl, {
      params,
      timeout: 15000,
    });

    const studies = response.data.studies || [];
    console.log(`  📊 Found ${studies.length} recent trials`);

    const items = [];

    for (const study of studies) {
      const protocolSection = study.protocolSection || {};
      const identificationModule = protocolSection.identificationModule || {};
      const descriptionModule = protocolSection.descriptionModule || {};
      const conditionsModule = protocolSection.conditionsModule || {};
      const interventionsModule = protocolSection.armsInterventionsModule || {};
      const designModule = protocolSection.designModule || {};
      const statusModule = protocolSection.statusModule || {};

      const nctId = identificationModule.nctId || "Unknown";
      const title = identificationModule.briefTitle || "";
      const summary = descriptionModule.briefSummary || "";
      const conditions = (conditionsModule.conditions || []).join(", ");
      const interventions = (interventionsModule.interventions || [])
        .map((i) => i.name)
        .join(", ");
      const phase = designModule.phases?.[0] || "Not specified";
      const status = statusModule.overallStatus || "Unknown";

      // Create a comprehensive text description
      const text =
        `Clinical Trial ${nctId}: ${title}. Phase: ${phase}. Status: ${status}. ${summary}. Conditions: ${conditions}. Interventions: ${interventions}`.substring(
          0,
          500,
        );

      items.push({
        text,
        source: `clinical-trials:${nctId}`,
        timestamp: new Date(),
      });
    }

    console.log(`🔬 Clinical trials fetch complete: ${items.length} items`);
    return items;
  } catch (err) {
    console.error("❌ Clinical trials fetch failed:", err.message);

    // Return empty array on error (don't break the pipeline)
    return [];
  }
}

export default fetchClinicalTrials;
