import prisma from "../prisma/client.js";

export const getTrends = async (req, res, next) => {
  try {
    const trends = await prisma.trend.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Successfully fetched ${trends.length} trends from DB`);
    res.json(trends);
  } catch (err) {
    console.error("❌ Trends Controller Error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
};
