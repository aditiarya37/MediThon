// backend/src/services/fetchers/regulatory.fetcher.js
import Parser from "rss-parser";
import axios from "axios";
import * as cheerio from "cheerio";

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["description", "description"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

/**
 * Scrape FDA news directly from their newsroom page
 * Since their RSS feeds keep changing/breaking
 */
async function scrapeFDANews() {
  try {
    console.log("  🔍 Scraping FDA Newsroom page...");
    const response = await axios.get(
      "https://www.fda.gov/news-events/fda-newsroom/press-announcements",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 15000,
      },
    );

    const $ = cheerio.load(response.data);
    const items = [];

    // FDA uses this structure for press announcements
    $(".fda-card, .card, article").each((i, elem) => {
      if (i >= 15) return false; // Limit to 15 items

      const $elem = $(elem);
      const title = $elem
        .find("h3, h2, .card-title, .title")
        .first()
        .text()
        .trim();
      const link = $elem.find("a").first().attr("href");
      const dateText = $elem
        .find(".date, time, .posted-date")
        .first()
        .text()
        .trim();
      const summary = $elem
        .find("p, .description, .card-text")
        .first()
        .text()
        .trim();

      if (title && link) {
        const fullUrl = link.startsWith("http")
          ? link
          : `https://www.fda.gov${link}`;

        // Parse date
        let itemDate = new Date();
        if (dateText) {
          try {
            itemDate = new Date(dateText);
            if (isNaN(itemDate.getTime())) {
              itemDate = new Date();
            }
          } catch {
            itemDate = new Date();
          }
        }

        // Only include recent items (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (itemDate > sevenDaysAgo) {
          items.push({
            text: `${title}. ${summary}`.substring(0, 500),
            source: "regulatory:FDA Newsroom",
            timestamp: itemDate,
            url: fullUrl,
          });
        }
      }
    });

    return items;
  } catch (err) {
    console.error(`    ❌ FDA scraping failed: ${err.message}`);
    return [];
  }
}

/**
 * Scrape EMA news page
 */
async function scrapeEMANews() {
  try {
    console.log("  🔍 Scraping EMA News page...");
    const response = await axios.get("https://www.ema.europa.eu/en/news", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const items = [];

    // EMA news structure
    $("article, .views-row, .news-item").each((i, elem) => {
      if (i >= 15) return false;

      const $elem = $(elem);
      const title = $elem
        .find("h2, h3, .title a, .field--name-title a")
        .first()
        .text()
        .trim();
      const link = $elem.find("a").first().attr("href");
      const dateText = $elem
        .find(".date, time, .field--name-field-publication-date")
        .first()
        .text()
        .trim();
      const summary = $elem
        .find(".field--name-field-short-description, .field--name-body, p")
        .first()
        .text()
        .trim();

      if (title && link) {
        const fullUrl = link.startsWith("http")
          ? link
          : `https://www.ema.europa.eu${link}`;

        let itemDate = new Date();
        if (dateText) {
          try {
            itemDate = new Date(dateText);
            if (isNaN(itemDate.getTime())) {
              itemDate = new Date();
            }
          } catch {
            itemDate = new Date();
          }
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (itemDate > sevenDaysAgo) {
          items.push({
            text: `${title}. ${summary}`.substring(0, 500),
            source: "regulatory:EMA News",
            timestamp: itemDate,
            url: fullUrl,
          });
        }
      }
    });

    return items;
  } catch (err) {
    console.error(`    ❌ EMA scraping failed: ${err.message}`);
    return [];
  }
}

/**
 * Try to fetch from WHO pharmaceutical announcements
 */
async function scrapeWHOPharma() {
  try {
    console.log("  🔍 Scraping WHO Pharmaceutical News...");
    const response = await axios.get("https://www.who.int/news-room/releases", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const items = [];

    $(".list-view--item, article").each((i, elem) => {
      if (i >= 10) return false;

      const $elem = $(elem);
      const title = $elem
        .find(".link-container a, h3 a, h2 a")
        .first()
        .text()
        .trim();
      const link = $elem.find("a").first().attr("href");

      // Only include pharma/drug related items
      if (
        title &&
        (title.toLowerCase().includes("drug") ||
          title.toLowerCase().includes("medicine") ||
          title.toLowerCase().includes("pharmaceutical") ||
          title.toLowerCase().includes("treatment"))
      ) {
        const fullUrl = link?.startsWith("http")
          ? link
          : `https://www.who.int${link}`;

        items.push({
          text: title.substring(0, 500),
          source: "regulatory:WHO",
          timestamp: new Date(),
          url: fullUrl,
        });
      }
    });

    return items;
  } catch (err) {
    console.error(`    ❌ WHO scraping failed: ${err.message}`);
    return [];
  }
}

export async function fetchRegulatoryNews() {
  console.log("⚖️ Fetching regulatory announcements...");
  const allItems = [];

  // Scrape FDA (since RSS is broken)
  const fdaItems = await scrapeFDANews();
  allItems.push(...fdaItems);
  console.log(`    ✅ FDA Newsroom: ${fdaItems.length} items (scraped)`);

  // Scrape EMA (since RSS is broken)
  const emaItems = await scrapeEMANews();
  allItems.push(...emaItems);
  console.log(`    ✅ EMA News: ${emaItems.length} items (scraped)`);

  // Scrape WHO as bonus source
  const whoItems = await scrapeWHOPharma();
  allItems.push(...whoItems);
  console.log(`    ✅ WHO Pharma: ${whoItems.length} items (scraped)`);

  console.log(`⚖️ Regulatory fetch complete: ${allItems.length} total items`);
  return allItems;
}

export default fetchRegulatoryNews;
