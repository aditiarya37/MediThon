// backend/src/services/fetchers/rss.fetcher.js
import Parser from "rss-parser";
import axios from "axios";
import prisma from "../../../prisma/client.js";

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["description", "description"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

// Production-ready RSS feeds (verified working January 2026)
const RSS_FEEDS = [
  {
    url: "https://www.pharmaceutical-technology.com/feed/",
    name: "Pharmaceutical Technology",
  },
  {
    url: "https://www.biopharmadive.com/feeds/news/",
    name: "BioPharma Dive",
  },
  {
    url: "https://www.pharmatimes.com/news/rss",
    name: "PharmaTimes",
  },
  {
    url: "https://www.europeanpharmaceuticalreview.com/feed/",
    name: "European Pharmaceutical Review",
  },
  {
    url: "https://www.pharmaceutical-business-review.com/feed/",
    name: "Pharmaceutical Business Review",
  },
  {
    url: "https://www.drugtopics.com/rss",
    name: "Drug Topics",
  },
  {
    url: "https://www.pharmafocusasia.com/rss/news",
    name: "Pharma Focus Asia",
  },
];

/**
 * Advanced XML cleaning for problematic RSS feeds
 */
function cleanXML(xmlString) {
  if (typeof xmlString !== "string") return xmlString;

  return (
    xmlString
      // Fix XML declaration
      .replace(/<\?xml[^?]*\?>/gi, '<?xml version="1.0" encoding="UTF-8"?>')

      // Remove invalid control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")

      // Fix unescaped ampersands (common issue)
      .replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;")

      // Remove malformed attributes
      .replace(/\s+([a-zA-Z_:][\w:.-]*)\s*=\s*(?=[>\s])/g, "")

      // Fix unquoted attributes
      .replace(/\s+([a-zA-Z_:][\w:.-]*)\s*=\s*([^\s"'][^\s>]*)/g, ' $1="$2"')

      // Convert smart quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")

      // Remove zero-width characters
      .replace(/[\u200B-\u200D\uFEFF]/g, "")

      // Fix attribute spacing
      .replace(/([a-zA-Z0-9])(xmlns|href|src|type|rel)=/g, "$1 $2=")

      // Remove problematic comments
      .replace(/<!--[\s\S]*?-->/g, "")
  );
}

export async function fetchRSSFeeds() {
  console.log("📰 Fetching RSS feeds...");
  const allItems = [];

  try {
    // Check if this is first run or scheduled run
    const lastMeta = await prisma.event.findFirst({
      where: { source: "SYSTEM_METADATA", text: "rss_last_fetch" },
      orderBy: { createdAt: "desc" },
    });

    // Smart timestamp logic:
    // - First run: fetch last 24 hours
    // - Subsequent runs: fetch since last successful run
    let lastFetch;
    let isFirstRun = false;

    if (!lastMeta) {
      // First run - get last 24 hours of content
      lastFetch = new Date(Date.now() - 24 * 60 * 60 * 1000);
      isFirstRun = true;
      console.log("  🆕 First run detected - fetching last 24 hours");
    } else {
      // Check if last run was recent (within 15 minutes)
      const timeSinceLastRun = Date.now() - lastMeta.createdAt.getTime();
      const fifteenMinutes = 15 * 60 * 1000;

      if (timeSinceLastRun < fifteenMinutes) {
        // Very recent run - this is expected for CRON jobs
        lastFetch = lastMeta.createdAt;
        console.log(
          `  ⏰ Last run was ${Math.round(timeSinceLastRun / 1000)}s ago - checking for new items`,
        );
      } else {
        // Been a while - get content from last run plus safety margin
        lastFetch = new Date(lastMeta.createdAt.getTime() - 60 * 60 * 1000); // 1 hour safety margin
        console.log(`  📅 Fetching items since: ${lastFetch.toISOString()}`);
      }
    }

    for (const feed of RSS_FEEDS) {
      try {
        console.log(`  🔍 Fetching: ${feed.name}`);

        const response = await axios.get(feed.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            Accept:
              "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
          },
          timeout: 20000,
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
        });

        if (response.status === 403) {
          console.error(`    ❌ ${feed.name}: Blocked by server (403)`);
          continue;
        }

        if (response.status === 404) {
          console.error(`    ❌ ${feed.name}: Not found (404)`);
          continue;
        }

        if (response.status !== 200) {
          console.error(`    ❌ ${feed.name}: HTTP ${response.status}`);
          continue;
        }

        // Clean and parse XML
        const cleanedXml = cleanXML(response.data);

        let parsed;
        try {
          parsed = await parser.parseString(cleanedXml);
        } catch (parseErr) {
          console.error(
            `    ❌ ${feed.name}: ${parseErr.message.split("\n")[0]}`,
          );
          continue;
        }

        if (!parsed?.items) {
          console.error(`    ❌ ${feed.name}: No items found`);
          continue;
        }

        let itemCount = 0;
        for (const item of parsed.items) {
          try {
            // Parse date with multiple fallbacks
            let itemDate = new Date();
            const dateString =
              item.pubDate || item.isoDate || item.published || item.date;

            if (dateString) {
              itemDate = new Date(dateString);
              if (isNaN(itemDate.getTime())) {
                itemDate = new Date();
              }
            }

            // Filter by date
            if (itemDate > lastFetch) {
              const description = (
                item.contentSnippet ||
                item.description ||
                item.contentEncoded ||
                item.content ||
                item.summary ||
                ""
              )
                .replace(/<[^>]*>/g, "")
                .trim(); // Strip HTML

              const text =
                `${item.title || "No title"}. ${description}`.substring(0, 500);

              allItems.push({
                text: text,
                source: `rss:${feed.name}`,
                timestamp: itemDate,
                url: item.link || item.guid || feed.url,
              });
              itemCount++;
            }
          } catch (itemErr) {
            // Skip individual problematic items silently
          }
        }

        console.log(`    ✅ ${feed.name}: ${itemCount} new items`);
      } catch (err) {
        const errorMsg =
          err.code === "ECONNABORTED"
            ? "Timeout"
            : err.response?.status
              ? `HTTP ${err.response.status}`
              : err.message.split("\n")[0];
        console.error(`    ❌ ${feed.name}: ${errorMsg}`);
      }
    }

    // Always update metadata (even if 0 items - this is expected behavior)
    await prisma.event.create({
      data: {
        text: "rss_last_fetch",
        category: "REGULATION_POLICY",
        confidence: 1.0,
        source: "SYSTEM_METADATA",
        createdAt: new Date(),
      },
    });

    const summary = isFirstRun
      ? `📰 RSS initial fetch complete: ${allItems.length} items (last 24h)`
      : `📰 RSS fetch complete: ${allItems.length} new items`;

    console.log(summary);
  } catch (err) {
    console.error("❌ RSS error:", err.message);
  }

  return allItems;
}

export default fetchRSSFeeds;
