import { classifyText } from "../services/classifier.service.js";
import { saveEvent } from "../services/event.service.js";
import { mapLabelToCategory } from "../utils/categoryMapper.js";
import { runTrendDetection } from "../services/trend.service.js";

export const classifyAndStore = async (req, res, next) => {
  try {
    const { text, source } = req.body;

    // 1️⃣ Run classifier
    const result = await classifyText(text, source);

    // 2️⃣ Normalize label → enum
    const categoryEnum = mapLabelToCategory(result.label);

    // 3️⃣ Save event
    const savedEvent = await saveEvent({
      text,
      category: categoryEnum,
      confidence: result.confidence,
      source,
    });

    // 4️⃣ 🔥 AUTO-RUN TREND DETECTION (with error handling)
    // Run in background but log if it fails
    runTrendDetection()
      .then(() => {
        console.log("✅ Trend detection triggered successfully");
      })
      .catch((err) => {
        console.error("❌ Trend detection failed:", err.message);
      });

    // 5️⃣ Respond immediately
    res.status(201).json(savedEvent);
  } catch (err) {
    next(err);
  }
};
