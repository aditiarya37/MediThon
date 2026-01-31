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
        const result = await classifyText(item.text, item.source);
        const categoryEnum = mapLabelToCategory(result.label);

        await saveEvent({
          text: item.text,
          category: categoryEnum,
          confidence: result.confidence,
          source: item.source,
          externalId: item.url || item.id || null,
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

      const [rssTexts, trialTexts, regulatoryTexts, pubmedTexts] =
        await Promise.allSettled([
          fetchRSSFeeds(),
          fetchClinicalTrials(),
          fetchRegulatoryNews(),
          fetchPubMedAbstracts(),
        ]);

      if (rssTexts.status === "fulfilled") allTexts.push(...rssTexts.value);
      if (trialTexts.status === "fulfilled") allTexts.push(...trialTexts.value);
      if (regulatoryTexts.status === "fulfilled")
        allTexts.push(...regulatoryTexts.value);
      if (pubmedTexts.status === "fulfilled")
        allTexts.push(...pubmedTexts.value);

      this.stats.totalFetches += allTexts.length;

      if (allTexts.length > 0) {
        const { processedCount } = await this.processBatch(allTexts);
        if (processedCount > 0) {
          await runTrendDetection();
        }
      }
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

    // Runs every 2 hours (0 */2 * * *)
    const mainJob = cron.schedule("0 */2 * * *", async () => {
      await this.runDataFetchJob();
    });
    this.jobs.push(mainJob);

    const trendJob = cron.schedule("0 * * * *", async () => {
      try {
        await runTrendDetection();
      } catch (err) {
        console.error(err.message);
      }
    });
    this.jobs.push(trendJob);

    const cleanupJob = cron.schedule("0 0 * * *", () => {
      if (this.stats.errors.length > 100) {
        this.stats.errors = this.stats.errors.slice(-100);
      }
    });
    this.jobs.push(cleanupJob);

    // Initial run on startup
    this.runDataFetchJob();
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    console.log("🛑 Stopping scheduler service...");
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
  }

  /**
   * FIXED: Added missing getStats method for the controller
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      activeJobs: this.jobs.length,
      recentErrors: this.stats.errors.slice(-10),
    };
  }

  /**
   * Trigger manual run
   */
  async triggerManualRun() {
    await this.runDataFetchJob();
  }
}

const schedulerService = new SchedulerService();
export default schedulerService;
