// backend/src/services/fetchers/pubmed.fetcher.js
import axios from "axios";
import xml2js from "xml2js";

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

/**
 * Fetch recent pharmaceutical research abstracts from PubMed
 * Uses NCBI E-utilities API
 */
export async function fetchPubMedAbstracts() {
  console.log("📚 Fetching PubMed research abstracts...");

  try {
    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (date) => {
      return (
        date.getFullYear() +
        "/" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "/" +
        String(date.getDate()).padStart(2, "0")
      );
    };

    // Search terms focused on pharma
    const searchTerms = [
      "pharmaceutical",
      "drug development",
      "clinical trial",
      "adverse effects",
      "drug approval",
      "pharmacology",
    ].join(" OR ");

    const dateRange = `${formatDate(startDate)}:${formatDate(endDate)}[PDAT]`;
    const query = `(${searchTerms}) AND ${dateRange}`;

    console.log(`  🔍 Search query: ${query}`);

    // Step 1: Search for article IDs
    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi`;
    const searchResponse = await axios.get(searchUrl, {
      params: {
        db: "pubmed",
        term: query,
        retmax: 20, // Limit to 20 most recent
        retmode: "json",
        sort: "pub_date",
      },
      timeout: 10000,
    });

    const idList = searchResponse.data.esearchresult.idlist || [];
    console.log(`  📊 Found ${idList.length} recent articles`);

    if (idList.length === 0) {
      return [];
    }

    // Step 2: Fetch article details
    const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi`;
    const fetchResponse = await axios.get(fetchUrl, {
      params: {
        db: "pubmed",
        id: idList.join(","),
        retmode: "xml",
      },
      timeout: 15000,
    });

    // Parse XML response
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(fetchResponse.data);

    const articles = result.PubmedArticleSet?.PubmedArticle || [];
    const items = [];

    // Ensure articles is an array
    const articleArray = Array.isArray(articles) ? articles : [articles];

    for (const article of articleArray) {
      try {
        const medlineCitation = article.MedlineCitation;
        const articleData = medlineCitation?.Article || {};

        const pmid = medlineCitation?.PMID?._ || medlineCitation?.PMID || "";
        const title = articleData.ArticleTitle || "";
        const abstract = articleData.Abstract?.AbstractText || "";

        // Handle abstract (can be string or object)
        let abstractText = "";
        if (typeof abstract === "string") {
          abstractText = abstract;
        } else if (Array.isArray(abstract)) {
          abstractText = abstract
            .map((a) => (typeof a === "string" ? a : a._))
            .join(" ");
        } else if (abstract._) {
          abstractText = abstract._;
        }

        if (title && abstractText) {
          const text = `${title}. ${abstractText}`.substring(0, 500);

          items.push({
            text,
            source: `pubmed:${pmid}`,
            timestamp: new Date(),
          });
        }
      } catch (err) {
        console.error("  ❌ Error parsing article:", err.message);
        // Continue with other articles
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
