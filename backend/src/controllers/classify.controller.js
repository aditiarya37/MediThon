import { classifyText } from "../services/classifier.service.js";
import { saveEvent } from "../services/event.service.js";

export const classifyAndStore = async (req, res, next) => {
  try {
    const { text, source } = req.body;

    // 1. Call FastAPI classifier
    const result = await classifyText(text, source);

    // 2. Store in MongoDB
    const savedEvent = await saveEvent({
      text,
      category: result.category,
      confidence: result.confidence,
      source,
    });

    // 3. Respond to frontend
    res.status(201).json({
      success: true,
      data: savedEvent,
    });
  } catch (err) {
    next(err);
  }
};
