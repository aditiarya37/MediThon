#!/usr/bin/env node
// complete-fix.js - Run this to fix everything
import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";
import { execSync } from "child_process";
import fs from "fs";

console.log("🔧 COMPLETE PROJECT FIX\n");

async function completeFix() {
  const dbUrl = process.env.DATABASE_URL;
  const client = new MongoClient(dbUrl);

  try {
    // Step 1: Clean up MongoDB collections
    console.log("1️⃣ Cleaning up MongoDB collections...");
    await client.connect();
    const db = client.db("medithon");

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);
    console.log("   Existing collections:", collectionNames);

    // Drop capitalized collections if they exist
    if (collectionNames.includes("Event")) {
      await db.collection("Event").drop();
      console.log('   ✅ Dropped "Event" collection');
    }

    if (collectionNames.includes("Trend")) {
      await db.collection("Trend").drop();
      console.log('   ✅ Dropped "Trend" collection');
    }

    // Verify lowercase collections exist
    const eventsCount = collectionNames.includes("events")
      ? await db.collection("events").countDocuments()
      : 0;
    const trendsCount = collectionNames.includes("trends")
      ? await db.collection("trends").countDocuments()
      : 0;

    console.log(`   ✅ "events" collection: ${eventsCount} documents`);
    console.log(`   ✅ "trends" collection: ${trendsCount} documents\n`);

    await client.close();

    // Step 2: Update Prisma schema
    console.log("2️⃣ Updating Prisma schema...");
    const schemaPath = "./prisma/schema.prisma";
    const schemaContent = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model events {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  text       String
  category   Category
  confidence Float
  source     String
  createdAt  DateTime @default(now())
  
  @@map("events")
}

model trends {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  category    Category
  spikeScore  Float
  window      String
  sampleTexts String[]
  createdAt   DateTime @default(now())
  
  @@map("trends")
}

enum Category {
  BRAND_PERCEPTION
  SIDE_EFFECTS
  COMPETITOR_ACTIVITY
  REGULATION_POLICY
  CLINICAL_TRIALS
  MARKETING_PROMOTION
}
`;

    fs.writeFileSync(schemaPath, schemaContent);
    console.log("   ✅ Updated schema.prisma\n");

    // Step 3: Regenerate Prisma client
    console.log("3️⃣ Regenerating Prisma client...");
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("   ✅ Prisma client regenerated\n");

    // Step 4: Update controllers
    console.log("4️⃣ Updating controller files...");

    const trendsController = `import prisma from "../prisma/client.js";

export const getTrends = async (req, res, next) => {
  try {
    const trends = await prisma.trends.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(\`✅ Successfully fetched \${trends.length} trends from DB\`);
    res.json(trends);
  } catch (err) {
    console.error("❌ Trends Controller Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.message 
    });
  }
};
`;

    const eventsController = `import prisma from "../prisma/client.js";

export const getEvents = async (req, res, next) => {
  try {
    const events = await prisma.events.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(\`✅ Successfully fetched \${events.length} events from DB\`);
    res.json(events);
  } catch (err) {
    console.error("❌ Events Controller Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.message 
    });
  }
};
`;

    fs.writeFileSync(
      "./src/controllers/trends.controller.js",
      trendsController,
    );
    console.log("   ✅ Updated trends.controller.js");

    fs.writeFileSync(
      "./src/controllers/events.controller.js",
      eventsController,
    );
    console.log("   ✅ Updated events.controller.js\n");

    // Step 5: Verify
    console.log("5️⃣ Verifying setup...");
    const { default: prisma } = await import(
      "./src/prisma/client.js?t=" + Date.now()
    );

    const models = Object.keys(prisma).filter(
      (key) =>
        !key.startsWith("_") &&
        !key.startsWith("$") &&
        typeof prisma[key] === "object" &&
        prisma[key] !== null,
    );

    console.log("   Available Prisma models:", models);

    if (models.includes("events") && models.includes("trends")) {
      console.log("   ✅ Correct models found!\n");

      // Test queries
      const eventsCount = await prisma.events.count();
      const trendsCount = await prisma.trends.count();

      console.log("   📊 Database verification:");
      console.log(`      - events: ${eventsCount} documents`);
      console.log(`      - trends: ${trendsCount} documents\n`);

      if (eventsCount > 0 && trendsCount > 0) {
        console.log("✅ ✅ ✅ ALL CHECKS PASSED! ✅ ✅ ✅\n");
        console.log(
          "Your backend is now ready. Restart your server with: npm run dev\n",
        );
      } else {
        console.log(
          "⚠️ Collections exist but have no data. You may need to seed your database.\n",
        );
      }
    } else {
      console.error(
        '   ❌ Models not correctly generated. Expected: ["events", "trends"]',
      );
      console.error("   Got:", models);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error during fix:", error);
    process.exit(1);
  }
}

completeFix().catch(console.error);
