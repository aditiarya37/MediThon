// backend/src/services/fetchers/regulatory.fetcher.js
import Parser from "rss-parser";

const parser = new Parser();

// FDA and regulatory RSS feeds
const REGULATORY_FEEDS = [
  {
    url: "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/drug-safety-communications/rss.xml",
    name: "FDA Drug Safety",
  },
  {
    url: "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/drug-approvals-and-databases/rss.xml",
    name: "FDA Drug Approvals",
  },
  {
    url: "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml",
    name: "FDA Press Releases",
  },
  {
    url: "https://www.ema.europa.eu/en/news/rss",
    name: "EMA News",
  },
];

/**
 * Fetch regulatory announcements from FDA, EMA, and other agencies
 */
export async function fetchRegulatoryNews() {
  console.log("⚖️ Fetching regulatory announcements...");

  const allItems = [];

  for (const feed of REGULATORY_FEEDS) {
    try {
      console.log(`  🔍 Fetching: ${feed.name}`);

      const parsed = await parser.parseURL(feed.url);

      let itemCount = 0;

      for (const item of parsed.items) {
        const itemDate = new Date(item.pubDate || item.isoDate);

        // Only process items from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (itemDate > sevenDaysAgo) {
          const text =
            item.contentSnippet ||
            item.content ||
            item.description ||
            item.summary ||
            "";

          if (text && text.length > 50) {
            allItems.push({
              text: `${item.title}. ${text}`.substring(0, 500),
              source: `regulatory:${feed.name}`,
              timestamp: itemDate,
            });
            itemCount++;
          }
        }
      }

      console.log(`    ✅ ${feed.name}: ${itemCount} new items`);
    } catch (err) {
      console.error(`    ❌ ${feed.name}: ${err.message}`);
      // Continue with other feeds even if one fails
    }
  }

  console.log(`⚖️ Regulatory fetch complete: ${allItems.length} total items`);
  return allItems;
}

export default fetchRegulatoryNews;
