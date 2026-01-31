// backend/src/services/fetchers/pubmed.fetcher.js
import axios from "axios";
import xml2js from "xml2js";

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export async function fetchPubMedAbstracts() {
  console.log("📚 Fetching PubMed research abstracts...");

  try {
    const searchTerms = [
      "pharmaceutical",
      "drug development",
      "clinical trial",
    ].join(" OR ");

    // Step 1: Search for articles
    const searchResponse = await axios.get(`${PUBMED_BASE_URL}/esearch.fcgi`, {
      params: {
        db: "pubmed",
        term: searchTerms,
        retmax: 20,
        retmode: "json",
        sort: "pub_date",
        reldate: 30, // Last 30 days
      },
      timeout: 15000,
    });

    const idList = searchResponse.data.esearchresult?.idlist || [];

    if (idList.length === 0) {
      console.log("📚 No recent PubMed articles found");
      return [];
    }

    console.log(`  📊 Found ${idList.length} articles, fetching details...`);

    // Step 2: Fetch article details
    const fetchResponse = await axios.get(`${PUBMED_BASE_URL}/efetch.fcgi`, {
      params: {
        db: "pubmed",
        id: idList.join(","),
        retmode: "xml",
      },
      timeout: 15000,
    });

    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      normalize: true,
      normalizeTags: true,
      trim: true,
    });

    const result = await parser.parseStringPromise(fetchResponse.data);

    const articles = result.pubmedarticleset?.pubmedarticle || [];
    const articleArray = Array.isArray(articles) ? articles : [articles];

    const items = [];

    for (const article of articleArray) {
      try {
        const medlineCitation = article.medlinecitation || {};
        const pmidObj = medlineCitation.pmid;
        const pmid =
          typeof pmidObj === "object"
            ? pmidObj._ || pmidObj
            : pmidObj || "Unknown";

        const articleData = medlineCitation.article || {};
        const title = articleData.articletitle || "No Title";

        // Get abstract if available
        const abstractObj = articleData.abstract;
        let abstractText = "";

        if (abstractObj) {
          const abstractTextObj = abstractObj.abstracttext;
          if (Array.isArray(abstractTextObj)) {
            abstractText = abstractTextObj
              .map((t) => (typeof t === "object" ? t._ || t : t))
              .join(" ");
          } else if (typeof abstractTextObj === "object") {
            abstractText = abstractTextObj._ || abstractTextObj;
          } else {
            abstractText = abstractTextObj || "";
          }
        }

        // Get publication date
        const pubDate =
          medlineCitation.datecompleted || medlineCitation.datecreated || {};

        const year = pubDate.year || new Date().getFullYear();
        const month = pubDate.month || 1;
        const day = pubDate.day || 1;
        const timestamp = new Date(year, month - 1, day);

        const text = abstractText
          ? `${title}. ${abstractText}`.substring(0, 500)
          : title.substring(0, 500);

        items.push({
          text: text,
          source: `pubmed:${pmid}`,
          timestamp: timestamp,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        });
      } catch (itemErr) {
        console.error("    ⚠️  Error processing article:", itemErr.message);
      }
    }

    console.log(`📚 PubMed fetch complete: ${items.length} abstracts`);
    return items;
  } catch (err) {
    console.error("❌ PubMed fetch failed:", err.message);
    return [];
  }
}

export default fetchPubMedAbstracts;
