// backend/src/routes/scheduler.routes.js
import express from "express";
import {
  getSchedulerStatus,
  triggerManualRun,
  pauseScheduler,
  resumeScheduler,
} from "../controllers/scheduler.controller.js";

const router = express.Router();

// Get scheduler status and statistics
router.get("/scheduler/status", getSchedulerStatus);

// Trigger manual data fetch
router.post("/scheduler/trigger", triggerManualRun);

// Pause scheduler
router.post("/scheduler/pause", pauseScheduler);

// Resume scheduler
router.post("/scheduler/resume", resumeScheduler);

export default router;
