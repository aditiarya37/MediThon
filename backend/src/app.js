import express from "express";
import cors from "cors";
import classifyRoutes from "./routes/classify.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import trendsRoutes from "./routes/trends.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", classifyRoutes);
app.use("/api", eventsRoutes);
app.use("/api", trendsRoutes);

app.use(errorHandler);

export default app;
