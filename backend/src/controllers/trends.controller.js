// file: backend/src/controllers/trends.controller.js
import prisma from "../prisma/client.js";

export const getTrends = async (req, res, next) => {
  try {
    // We now use 'trendAlert' (camelCase of the new model name)
    const trends = await prisma.trendAlert.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(trends);
  } catch (err) {
    console.error("❌ Trends Controller Error:", err); // Log the actual error
    next(err);
  }
};
