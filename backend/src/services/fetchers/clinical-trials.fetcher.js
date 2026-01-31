// backend/src/services/fetchers/clinical-trials.fetcher.js
import axios from "axios";

/**
 * Fetch recent clinical trial updates from ClinicalTrials.gov API
 * Uses the API v2: https://clinicaltrials.gov/api/v2/studies
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

    console.log(
      `  📅 Fetching trials updated between ${formatDate(startDate)} and ${formatDate(endDate)}`,
    );

    // ClinicalTrials.gov API v2 endpoint
    const baseUrl = "https://clinicaltrials.gov/api/v2/studies";

    const params = {
      "query.term": "pharma OR pharmaceutical OR drug OR medicine",
      "filter.advanced": `AREA[LastUpdatePostDate]RANGE[${formatDate(startDate)}, ${formatDate(endDate)}]`,
      fields:
        "NCTId,BriefTitle,BriefSummary,Condition,InterventionName,Phase,OverallStatus,LastUpdatePostDate",
      pageSize: 50,
      format: "json",
    };

    const response = await axios.get(baseUrl, {
      params,
      headers: {
        Accept: "application/json",
        "User-Agent": "PharmaRadar/1.0 (Research Application)",
      },
      timeout: 20000, // Clinical trials API can be slow
    });

    const studies = response.data.studies || [];
    console.log(`  📊 Found ${studies.length} recent trials`);

    const items = [];

    for (const study of studies) {
      try {
        const protocolSection = study.protocolSection || {};
        const identificationModule = protocolSection.identificationModule || {};
        const descriptionModule = protocolSection.descriptionModule || {};
        const conditionsModule = protocolSection.conditionsModule || {};
        const interventionsModule =
          protocolSection.armsInterventionsModule || {};
        const designModule = protocolSection.designModule || {};
        const statusModule = protocolSection.statusModule || {};

        const nctId = identificationModule.nctId || "Unknown";
        const title = identificationModule.briefTitle || "No title";
        const summary = descriptionModule.briefSummary || "";

        const conditions = (conditionsModule.conditions || []).join(", ");

        const interventions = (interventionsModule.interventions || [])
          .map((i) => i.name)
          .filter(Boolean)
          .join(", ");

        const phases = designModule.phases || [];
        const phase = phases.length > 0 ? phases.join(", ") : "Not specified";

        const status = statusModule.overallStatus || "Unknown";

        // Get the update date
        const updateDate = statusModule.lastUpdatePostDate
          ? new Date(statusModule.lastUpdatePostDate)
          : new Date();

        // Create a comprehensive text description
        const textParts = [
          `Clinical Trial ${nctId}: ${title}`,
          `Phase: ${phase}`,
          `Status: ${status}`,
        ];

        if (summary) {
          textParts.push(summary);
        }

        if (conditions) {
          textParts.push(`Conditions: ${conditions}`);
        }

        if (interventions) {
          textParts.push(`Interventions: ${interventions}`);
        }

        const text = textParts.join(". ").substring(0, 500);

        items.push({
          text,
          source: `clinical-trials:${nctId}`,
          timestamp: updateDate,
          url: `https://clinicaltrials.gov/study/${nctId}`,
        });
      } catch (itemErr) {
        console.error("    ⚠️  Error processing trial:", itemErr.message);
      }
    }

    console.log(`🔬 Clinical trials fetch complete: ${items.length} items`);
    return items;
  } catch (err) {
    const errorMsg = err.response?.status
      ? `HTTP ${err.response.status} - ${err.response.statusText}`
      : err.message;

    console.error("❌ Clinical trials fetch failed:", errorMsg);

    // Log more details for debugging
    if (err.response?.data) {
      console.error(
        "    Response data:",
        JSON.stringify(err.response.data).substring(0, 200),
      );
    }

    return [];
  }
}

export default fetchClinicalTrials;
