import prisma from "../../prisma/client.js";

export const saveEvent = async ({
  text,
  category,
  confidence,
  source,
  externalId,
}) => {
  // If we have a unique ID (like a URL), use upsert to avoid duplicates
  if (externalId) {
    return prisma.event.upsert({
      where: { externalId },
      update: { confidence, category }, // Update if the analysis changes
      create: {
        text,
        category,
        confidence,
        source,
        externalId,
      },
    });
  }

  // Fallback for manual inputs or items without IDs
  return prisma.event.create({
    data: { text, category, confidence, source },
  });
};

export const getEvents = async () => {
  return prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });
};
