// test-controller-prisma.js - Test the exact Prisma client used by controllers
import prisma from "./prisma/client.js"; // Use EXACT same import as your controllers

async function testControllerPrisma() {
  console.log("🧪 Testing Prisma Client from ./prisma/client.js\n");

  try {
    console.log("1️⃣ Testing Trend.findMany()...");
    const trends = await prisma.trend.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(
      `${trends.length > 0 ? "✅" : "❌"} Found ${trends.length} trends`,
    );

    if (trends.length > 0) {
      console.log("\n📝 Sample trend:");
      console.log(JSON.stringify(trends[0], null, 2));
    } else {
      console.log(
        "\n❌ PROBLEM: Prisma client from ./prisma/client.js returns 0 trends!",
      );
      console.log("\nThis means your prisma/client.js has an issue.");
      console.log("\nYour prisma/client.js should look like:");
      console.log(`
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
      `);
      console.log("\nMake sure:");
      console.log('1. It uses "export default prisma" not "export { prisma }"');
      console.log("2. It's connecting to the right database (check .env)");
      console.log("3. Run: npx prisma generate");
    }

    console.log("\n2️⃣ Testing Event.findMany() for comparison...");
    const events = await prisma.event.findMany({ take: 1 });
    console.log(
      `${events.length > 0 ? "✅" : "❌"} Found ${events.length} events`,
    );

    if (events.length > 0 && trends.length === 0) {
      console.log("\n❌ ISSUE: Events work but Trends don't!");
      console.log(
        "This confirms the issue is with the Trend model specifically.",
      );
      console.log("\nCheck schema.prisma:");
      console.log('  - Is @@map("trends") correct?');
      console.log("  - Are field types matching MongoDB?");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testControllerPrisma();
