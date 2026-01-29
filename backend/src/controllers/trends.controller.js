import prisma from "../prisma/client.js";

export const getTrends = async (req, res, next) => {
  try {
    const trends = await prisma.trend.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(trends);
  } catch (err) {
    next(err);
  }
};
