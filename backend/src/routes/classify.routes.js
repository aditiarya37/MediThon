import express from "express";
import { classifyAndStore } from "../controllers/classify.controller.js";
import { validateClassifyInput } from "../middlewares/validate.middleware.js";

const router = express.Router();

router.post("/classify", validateClassifyInput, classifyAndStore);

export default router;
