import prisma from "../prisma/client.js";

export const getEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Successfully fetched ${events.length} events from DB`);
    res.json(events);
  } catch (err) {
    console.error("❌ Events Controller Error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
};
