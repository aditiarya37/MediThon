// backend/src/routes/scheduler.routes.js
import express from "express";
import {
  getSchedulerStatus,
  triggerManualRun,
  pauseScheduler,
  resumeScheduler,
} from "../controllers/scheduler.controller.js";

const router = express.Router();

// Matches: GET http://localhost:5000/api/scheduler/status
router.get("/status", getSchedulerStatus);

// Matches: POST http://localhost:5000/api/scheduler/run
// Fixed path from "/scheduler/trigger" to "/run" to match frontend api.js
router.post("/run", triggerManualRun);

// Matches: POST http://localhost:5000/api/scheduler/pause
router.post("/pause", pauseScheduler);

// Matches: POST http://localhost:5000/api/scheduler/resume
router.post("/resume", resumeScheduler);

export default router;
