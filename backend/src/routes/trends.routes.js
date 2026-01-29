import express from "express";
import { getTrends } from "../controllers/trends.controller.js";

const router = express.Router();

router.get("/trends", getTrends);

export default router;
