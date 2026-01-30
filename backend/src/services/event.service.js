import prisma from "../../prisma/client.js";

export const saveEvent = async ({ text, category, confidence, source }) => {
  return prisma.event.create({
    data: {
      text,
      category,
      confidence,
      source,
    },
  });
};

export const getEvents = async () => {
  return prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });
};
