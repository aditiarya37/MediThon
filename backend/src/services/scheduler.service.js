// backend/src/services/scheduler.service.js
import cron from "node-cron";
import { fetchRSSFeeds } from "./fetchers/rss.fetcher.js";
import { fetchClinicalTrials } from "./fetchers/clinical-trials.fetcher.js";
import { fetchRegulatoryNews } from "./fetchers/regulatory.fetcher.js";
import { fetchPubMedAbstracts } from "./fetchers/pubmed.fetcher.js";
import { classifyText } from "./classifier.service.js";
import { saveEvent } from "./event.service.js";
import { mapLabelToCategory } from "../utils/categoryMapper.js";
import { runTrendDetection } from "./trend.service.js";

class SchedulerService {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
    this.stats = {
      totalFetches: 0,
      totalClassified: 0,
      lastRun: null,
      errors: [],
    };
  }

  /**
   * Process a batch of texts through the classifier and store events
   */
  async processBatch(texts) {
    let processedCount = 0;
    let errorCount = 0;

    console.log(`📦 Processing batch of ${texts.length} items...`);

    for (const item of texts) {
      try {
        // 1. Classify the text
        const result = await classifyText(item.text, item.source);

        // 2. Map to category enum
        const categoryEnum = mapLabelToCategory(result.label);

        // 3. Save event
        await saveEvent({
          text: item.text,
          category: categoryEnum,
          confidence: result.confidence,
          source: item.source,
        });

        processedCount++;
        this.stats.totalClassified++;
      } catch (err) {
        errorCount++;
        console.error(
          `❌ Failed to process item from ${item.source}:`,
          err.message,
        );
        this.stats.errors.push({
          timestamp: new Date(),
          source: item.source,
          error: err.message,
        });
      }
    }

    console.log(
      `✅ Batch processed: ${processedCount} successful, ${errorCount} errors`,
    );
    return { processedCount, errorCount };
  }

  /**
   * Main job that fetches from all sources and processes them
   */
  async runDataFetchJob() {
    if (this.isRunning) {
      console.log("⏭️ Previous job still running, skipping...");
      return;
    }

    this.isRunning = true;
    this.stats.lastRun = new Date();

    console.log("\n" + "=".repeat(60));
    console.log("🔄 AUTOMATED DATA FETCH JOB STARTED");
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log("=".repeat(60) + "\n");

    try {
      const allTexts = [];

      // Fetch from all sources in parallel
      const [rssTexts, trialTexts, regulatoryTexts, pubmedTexts] =
        await Promise.allSettled([
          fetchRSSFeeds(),
          fetchClinicalTrials(),
          fetchRegulatoryNews(),
          fetchPubMedAbstracts(),
        ]);

      // Collect successful results
      if (rssTexts.status === "fulfilled") {
        allTexts.push(...rssTexts.value);
      } else {
        console.error("❌ RSS fetch failed:", rssTexts.reason);
      }

      if (trialTexts.status === "fulfilled") {
        allTexts.push(...trialTexts.value);
      } else {
        console.error("❌ Clinical trials fetch failed:", trialTexts.reason);
      }

      if (regulatoryTexts.status === "fulfilled") {
        allTexts.push(...regulatoryTexts.value);
      } else {
        console.error("❌ Regulatory fetch failed:", regulatoryTexts.reason);
      }

      if (pubmedTexts.status === "fulfilled") {
        allTexts.push(...pubmedTexts.value);
      } else {
        console.error("❌ PubMed fetch failed:", pubmedTexts.reason);
      }

      this.stats.totalFetches += allTexts.length;

      console.log(
        `\n📊 Fetched ${allTexts.length} total items from all sources`,
      );

      if (allTexts.length === 0) {
        console.log("ℹ️ No new items to process");
        return;
      }

      // Process the batch
      const { processedCount } = await this.processBatch(allTexts);

      // Trigger trend detection if we processed items
      if (processedCount > 0) {
        console.log("\n🔍 Triggering trend detection...");
        await runTrendDetection();
        console.log("✅ Trend detection completed");
      }

      console.log("\n" + "=".repeat(60));
      console.log("✅ AUTOMATED DATA FETCH JOB COMPLETED");
      console.log(`📊 Processed: ${processedCount}/${allTexts.length} items`);
      console.log("=".repeat(60) + "\n");
    } catch (err) {
      console.error("❌ Fatal error in data fetch job:", err);
      this.stats.errors.push({
        timestamp: new Date(),
        source: "scheduler",
        error: err.message,
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    console.log("🚀 Starting scheduler service...");

    // Main data fetch job - runs every 10 minutes
    const mainJob = cron.schedule("0 */2 * * *", async () => {
      await this.runDataFetchJob();
    });
    this.jobs.push(mainJob);

    // Hourly trend detection (backup to ensure trends are fresh)
    const trendJob = cron.schedule("0 * * * *", async () => {
      console.log("⏰ Hourly trend detection triggered");
      try {
        await runTrendDetection();
        console.log("✅ Hourly trend detection completed");
      } catch (err) {
        console.error("❌ Hourly trend detection failed:", err.message);
      }
    });
    this.jobs.push(trendJob);

    // Stats cleanup - keep only last 100 errors (runs daily)
    const cleanupJob = cron.schedule("0 0 * * *", () => {
      if (this.stats.errors.length > 100) {
        this.stats.errors = this.stats.errors.slice(-100);
        console.log("🧹 Cleaned up old error logs");
      }
    });
    this.jobs.push(cleanupJob);

    console.log("✅ Scheduler started:");
    console.log("  - Data fetch: Every 10 minutes");
    console.log("  - Trend detection: Every hour");
    console.log("  - Stats cleanup: Daily at midnight");

    // Run immediately on startup
    console.log("\n🏃 Running initial data fetch...");
    this.runDataFetchJob();
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    console.log("🛑 Stopping scheduler service...");
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
    console.log("✅ Scheduler stopped");
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      activeJobs: this.jobs.length,
      recentErrors: this.stats.errors.slice(-10), // Last 10 errors
    };
  }

  /**
   * Trigger manual run (for testing/debugging)
   */
  async triggerManualRun() {
    console.log("🔧 Manual run triggered");
    await this.runDataFetchJob();
  }
}

// Singleton instance
const schedulerService = new SchedulerService();

export default schedulerService;
