import prisma from "../prisma/client.js";

export const getEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, // limit for dashboard
    });

    res.json(events);
  } catch (err) {
    next(err);
  }
};
