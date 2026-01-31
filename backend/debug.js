// scripts/diagnose-trends.js
// Run this to understand why no trends are being detected

import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.DATABASE_URL;

async function diagnoseTrends() {
  console.log("🔍 TREND DETECTION DIAGNOSTIC\n");
  console.log("=".repeat(60) + "\n");

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db("medithon");
    const eventsCollection = db.collection("Event");

    // 1. Check total events
    const totalEvents = await eventsCollection.countDocuments({});
    console.log(`📊 Total Events: ${totalEvents}\n`);

    if (totalEvents === 0) {
      console.log("❌ No events in database - trend detection needs data!\n");
      return;
    }

    // 2. Check events by category
    console.log("📋 Events by Category:");
    const categories = await eventsCollection
      .aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray();

    categories.forEach((cat) => {
      console.log(`   ${cat._id}: ${cat.count} events`);
    });
    console.log("");

    // 3. Check time distribution
    console.log("📅 Time Distribution:");
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last12h = new Date(now - 12 * 60 * 60 * 1000);
    const last6h = new Date(now - 6 * 60 * 60 * 1000);
    const last2h = new Date(now - 2 * 60 * 60 * 1000);

    const recentCounts = await Promise.all([
      eventsCollection.countDocuments({ createdAt: { $gte: last24h } }),
      eventsCollection.countDocuments({ createdAt: { $gte: last12h } }),
      eventsCollection.countDocuments({ createdAt: { $gte: last6h } }),
      eventsCollection.countDocuments({ createdAt: { $gte: last2h } }),
    ]);

    console.log(`   Last 24 hours: ${recentCounts[0]} events`);
    console.log(`   Last 12 hours: ${recentCounts[1]} events`);
    console.log(`   Last 6 hours:  ${recentCounts[2]} events`);
    console.log(`   Last 2 hours:  ${recentCounts[3]} events`);
    console.log("");

    // 4. Check oldest and newest events
    const oldest = await eventsCollection.findOne(
      {},
      { sort: { createdAt: 1 } },
    );
    const newest = await eventsCollection.findOne(
      {},
      { sort: { createdAt: -1 } },
    );

    console.log("🕐 Event Timeline:");
    console.log(`   Oldest event: ${oldest.createdAt.toISOString()}`);
    console.log(`   Newest event: ${newest.createdAt.toISOString()}`);

    const timeSpan = (newest.createdAt - oldest.createdAt) / (1000 * 60 * 60); // hours
    console.log(`   Time span: ${timeSpan.toFixed(1)} hours\n`);

    // 5. Simulate aggregation (what trend detection sees)
    console.log("🔬 Simulated Trend Detection Data:");
    console.log("   (This is what the Python API should be analyzing)\n");

    // Group by category and time buckets (1 minute)
    const aggregated = await eventsCollection
      .aggregate([
        {
          $addFields: {
            bucket: {
              $dateTrunc: {
                date: "$createdAt",
                unit: "minute",
              },
            },
          },
        },
        {
          $group: {
            _id: {
              category: "$category",
              bucket: "$bucket",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.category",
            buckets: {
              $push: {
                time: "$_id.bucket",
                count: "$count",
              },
            },
            totalBuckets: { $sum: 1 },
            avgCount: { $avg: "$count" },
            maxCount: { $max: "$count" },
          },
        },
        { $sort: { totalBuckets: -1 } },
      ])
      .toArray();

    aggregated.forEach((cat) => {
      console.log(`   ${cat._id}:`);
      console.log(`      Time buckets: ${cat.totalBuckets}`);
      console.log(`      Avg per bucket: ${cat.avgCount.toFixed(2)}`);
      console.log(`      Max in bucket: ${cat.maxCount}`);

      // Check if spike exists
      const spikeRatio = cat.maxCount / cat.avgCount;
      if (spikeRatio > 1.2) {
        console.log(
          `      🚨 SPIKE DETECTED! ${spikeRatio.toFixed(2)}x above average`,
        );
      } else {
        console.log(
          `      ✅ No significant spike (${spikeRatio.toFixed(2)}x)`,
        );
      }
      console.log("");
    });

    // 6. Analysis
    console.log("=".repeat(60));
    console.log("📊 ANALYSIS:\n");

    if (timeSpan < 2) {
      console.log("❌ ISSUE: Not enough time span");
      console.log("   Events span only ${timeSpan.toFixed(1)} hours");
      console.log("   Need at least 2-4 hours of data for trend detection\n");
    }

    const hasEnoughBuckets = aggregated.some((cat) => cat.totalBuckets >= 5);
    if (!hasEnoughBuckets) {
      console.log("❌ ISSUE: Not enough time buckets");
      console.log("   Need at least 5 time periods per category");
      console.log(
        "   Currently: " +
          aggregated.map((c) => `${c._id}: ${c.totalBuckets}`).join(", "),
      );
      console.log("\n💡 SOLUTION: Wait for more data collection cycles\n");
    }

    const hasSpikes = aggregated.some(
      (cat) => cat.maxCount / cat.avgCount > 1.2,
    );
    if (!hasSpikes) {
      console.log("⚠️  ISSUE: No significant spikes detected");
      console.log("   All categories have relatively uniform distribution");
      console.log("   Spike threshold: 1.2x (20% above average)");
      console.log(
        "\n💡 SOLUTION: Either wait for real spikes or lower threshold\n",
      );
    }

    console.log("=".repeat(60) + "\n");

    // 7. Recommendations
    console.log("📝 RECOMMENDATIONS:\n");

    if (timeSpan < 4) {
      console.log("1. ⏰ Wait for more data cycles (need 4+ hours of data)");
    }

    if (!hasEnoughBuckets) {
      console.log("2. 📊 Current data too concentrated in time");
      console.log(
        "   Scheduler needs to run multiple times to create distribution",
      );
    }

    if (!hasSpikes) {
      console.log("3. 🎯 To test trend detection now:");
      console.log("   - Manually add some concentrated events in one category");
      console.log(
        "   - OR lower SPIKE_THRESHOLD in trend_model.py (e.g., 1.1)",
      );
    }

    console.log(
      "\n💡 Quick Test: Add 50 manual SIDE_EFFECTS events to trigger a spike\n",
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

diagnoseTrends();
