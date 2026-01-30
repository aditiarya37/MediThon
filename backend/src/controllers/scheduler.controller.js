// backend/src/controllers/scheduler.controller.js
import schedulerService from "../services/scheduler.service.js";

/**
 * Get scheduler status and statistics
 */
export const getSchedulerStatus = (req, res) => {
  try {
    const stats = schedulerService.getStats();
    res.json({
      status: "active",
      ...stats,
    });
  } catch (err) {
    console.error("❌ Error fetching scheduler status:", err);
    res.status(500).json({
      error: "Failed to fetch scheduler status",
      details: err.message,
    });
  }
};

/**
 * Trigger a manual data fetch run
 */
export const triggerManualRun = async (req, res) => {
  try {
    console.log("🔧 Manual data fetch triggered via API");

    // Don't wait for completion - respond immediately
    res.json({
      message: "Manual data fetch triggered",
      status: "started",
    });

    // Run in background
    schedulerService.triggerManualRun().catch((err) => {
      console.error("❌ Manual run failed:", err);
    });
  } catch (err) {
    console.error("❌ Error triggering manual run:", err);
    res.status(500).json({
      error: "Failed to trigger manual run",
      details: err.message,
    });
  }
};

/**
 * Pause the scheduler
 */
export const pauseScheduler = (req, res) => {
  try {
    schedulerService.stop();
    res.json({
      message: "Scheduler paused successfully",
      status: "paused",
    });
  } catch (err) {
    console.error("❌ Error pausing scheduler:", err);
    res.status(500).json({
      error: "Failed to pause scheduler",
      details: err.message,
    });
  }
};

/**
 * Resume the scheduler
 */
export const resumeScheduler = (req, res) => {
  try {
    schedulerService.start();
    res.json({
      message: "Scheduler resumed successfully",
      status: "active",
    });
  } catch (err) {
    console.error("❌ Error resuming scheduler:", err);
    res.status(500).json({
      error: "Failed to resume scheduler",
      details: err.message,
    });
  }
};
