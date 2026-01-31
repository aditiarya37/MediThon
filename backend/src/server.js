// backend/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import classifyRoutes from "./routes/classify.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import trendsRoutes from "./routes/trends.routes.js";
import schedulerRoutes from "./routes/scheduler.routes.js";
import schedulerService from "./services/scheduler.service.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", classifyRoutes);
app.use("/api", eventsRoutes);
app.use("/api", trendsRoutes);
app.use("/api/scheduler", schedulerRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    scheduler: schedulerService.isRunning ? "active" : "inactive",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 PharmaRadar Backend Server");
  console.log("=".repeat(60));
  console.log(`📡 API Server running on http://localhost:${PORT}`);
  console.log(`🔍 Classifier API: ${process.env.CLASSIFIER_API_URL}`);
  console.log(`📊 Trend Detection API: ${process.env.TREND_API_URL}`);
  console.log("=".repeat(60) + "\n");

  // Start the automated scheduler
  console.log("🤖 Starting automated data collection...");
  schedulerService.start();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 SIGTERM received, shutting down gracefully...");
  schedulerService.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 SIGINT received, shutting down gracefully...");
  schedulerService.stop();
  process.exit(0);
});

export default app;
