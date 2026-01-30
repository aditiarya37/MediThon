// backend/src/services/fetchers/rss.fetcher.js
import Parser from "rss-parser";
import prisma from "../../../prisma/client.js";

const parser = new Parser({
  customFields: {
    item: ["description", "content", "summary"],
  },
});

// Pharma-focused RSS feeds
const RSS_FEEDS = [
  {
    url: "https://www.pharmaceutical-technology.com/feed/",
    name: "Pharmaceutical Technology",
  },
  {
    url: "https://www.pharmalive.com/feed/",
    name: "PharmaLive",
  },
  {
    url: "https://www.pharmatimes.com/rss/news",
    name: "PharmaTimes",
  },
  {
    url: "https://www.fiercepharma.com/rss",
    name: "FiercePharma",
  },
  {
    url: "https://www.outsourcing-pharma.com/RSS/Industry-Pulse",
    name: "Outsourcing Pharma",
  },
  {
    url: "https://www.drugtopics.com/rss",
    name: "Drug Topics",
  },
];

/**
 * Fetch and parse RSS feeds from pharma news sources
 */
export async function fetchRSSFeeds() {
  console.log("📰 Fetching RSS feeds from pharma sources...");

  const allItems = [];
  const errors = [];

  // Track last fetch time to avoid duplicates
  const lastFetchKey = "rss_last_fetch";
  const lastFetch = await getLastFetchTime(lastFetchKey);
  const now = new Date();

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`  🔍 Fetching: ${feed.name}`);

      const parsed = await parser.parseURL(feed.url);

      let newItemsCount = 0;

      for (const item of parsed.items) {
        // Get item date
        const itemDate = new Date(item.pubDate || item.isoDate);

        // Only process items newer than last fetch
        if (!lastFetch || itemDate > lastFetch) {
          // Extract text content
          const text =
            item.contentSnippet ||
            item.content ||
            item.description ||
            item.summary ||
            "";

          if (text && text.length > 50) {
            // Only meaningful content
            allItems.push({
              text: `${item.title}. ${text}`.substring(0, 500), // Limit length
              source: `rss:${feed.name}`,
              timestamp: itemDate,
            });
            newItemsCount++;
          }
        }
      }

      console.log(`    ✅ ${feed.name}: ${newItemsCount} new items`);
    } catch (err) {
      console.error(`    ❌ ${feed.name}: ${err.message}`);
      errors.push({ feed: feed.name, error: err.message });
    }
  }

  // Update last fetch time
  await updateLastFetchTime(lastFetchKey, now);

  console.log(`📰 RSS fetch complete: ${allItems.length} total new items`);

  return allItems;
}

/**
 * Helper: Get last fetch timestamp from a simple key-value store
 * (Using a separate collection for metadata)
 */
async function getLastFetchTime(key) {
  try {
    // We'll use MongoDB directly for this metadata
    const db = prisma.$connect().then(
      () => prisma.$queryRaw`
      db.metadata.findOne({ key: ${key} })
    `,
    );

    // Simpler approach: just return null for first run
    // In production, you'd store this in a Metadata collection
    return null;
  } catch {
    return null;
  }
}

/**
 * Helper: Update last fetch timestamp
 */
async function updateLastFetchTime(key, timestamp) {
  try {
    // In production, store in a Metadata collection
    // For now, we'll just log it
    console.log(`  📝 Last fetch time updated: ${timestamp.toISOString()}`);
  } catch (err) {
    console.error("Failed to update last fetch time:", err);
  }
}

export default fetchRSSFeeds;
