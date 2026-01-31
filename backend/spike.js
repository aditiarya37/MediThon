// scripts/inject-test-spike.js
// Creates a spike in SIDE_EFFECTS to test trend detection

import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.DATABASE_URL;

async function injectTestSpike() {
  console.log("🧪 INJECTING TEST SPIKE FOR TREND DETECTION\n");

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db("medithon");
    const eventsCollection = db.collection("Event");

    // Create a spike: Add 30 SIDE_EFFECTS events in the last hour
    // And 5 events per hour for the previous 4 hours (baseline)

    const now = new Date();
    const events = [];

    console.log("📊 Creating baseline events (last 8 hours)...");
    // Baseline: 5 events per 2-hour period for the last 8 hours
    for (let i = 8; i > 2; i -= 2) {
      const timestamp = new Date(now - i * 60 * 60 * 1000);
      for (let j = 0; j < 5; j++) {
        events.push({
          text: `Baseline test event ${i}h ago - ${j}`,
          category: "SIDE_EFFECTS",
          confidence: 0.85,
          source: "test:baseline",
          externalId: `test-baseline-${i}-${j}-${Date.now()}`,
          createdAt: new Date(timestamp.getTime() + j * 60000), // Spread across minutes
        });
      }
    }

    console.log("🚨 Creating spike events (last 2 hours)...");
    // Spike: 30 events in the last 2 hours
    for (let i = 0; i < 30; i++) {
      const timestamp = new Date(now - Math.random() * 2 * 60 * 60 * 1000); // Random time in last 2h
      events.push({
        text: `SPIKE TEST EVENT: Severe adverse reaction reported in clinical trial - patient ${i}`,
        category: "SIDE_EFFECTS",
        confidence: 0.92,
        source: "test:spike",
        externalId: `test-spike-${i}-${Date.now()}`,
        createdAt: timestamp,
      });
    }

    // Also add some events to other categories for comparison
    console.log("📝 Adding normal events to other categories...");
    const otherCategories = [
      "CLINICAL_TRIALS",
      "REGULATION_POLICY",
      "BRAND_PERCEPTION",
    ];

    for (const category of otherCategories) {
      for (let i = 8; i > 0; i -= 2) {
        const timestamp = new Date(now - i * 60 * 60 * 1000);
        for (let j = 0; j < 3; j++) {
          events.push({
            text: `Normal ${category} event ${i}h ago - ${j}`,
            category: category,
            confidence: 0.8,
            source: "test:normal",
            externalId: `test-${category}-${i}-${j}-${Date.now()}`,
            createdAt: new Date(timestamp.getTime() + j * 60000),
          });
        }
      }
    }

    console.log(`\n💾 Inserting ${events.length} test events...`);
    const result = await eventsCollection.insertMany(events);
    console.log(`✅ Inserted ${result.insertedCount} events\n`);

    console.log("📊 Expected Results:");
    console.log("   SIDE_EFFECTS: Should show HIGH spike");
    console.log("   - Baseline: ~5 events per 2h period");
    console.log("   - Current: ~30 events in last 2h");
    console.log("   - Spike: 6x above baseline (600% increase!)");
    console.log("");
    console.log("   Other categories: Should show no spike");
    console.log("   - Consistent ~3 events per 2h period\n");

    console.log("🚀 Next Steps:");
    console.log("   1. Trigger trend detection:");
    console.log("      curl -X POST http://localhost:8001/detect-trends");
    console.log("");
    console.log("   2. Or wait for automatic detection (next scheduler run)");
    console.log("");
    console.log("   3. Check trends:");
    console.log("      curl http://localhost:5000/api/trends");
    console.log("");
    console.log("   4. View in dashboard:");
    console.log("      http://localhost:3000\n");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

injectTestSpike();
