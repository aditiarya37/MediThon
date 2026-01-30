// spike-no-health.js
// Works without /health endpoint - goes straight to /api/classify

import axios from "axios";

const BACKEND_URL = "http://localhost:5000";
// Standardized endpoint path
const CLASSIFY_ENDPOINT = "/api/classify";

// Sample texts
const sampleTexts = {
  SIDE_EFFECTS: [
    "Patient reported severe headache after medication",
    "Experiencing nausea and dizziness",
    "Allergic reaction observed with skin rash",
    "Patient complained of fatigue and drowsiness",
    "Adverse reaction: increased heart rate",
    "Side effect: stomach pain and vomiting",
    "Patient experiencing muscle weakness",
    "Reported difficulty breathing after dose",
    "Skin irritation and itching observed",
    "Patient has persistent dry cough",
  ],
  BRAND_PERCEPTION: [
    "Customers love our new product line",
    "Negative reviews about customer service",
    "Brand reputation improving significantly",
    "Social media sentiment is very positive",
    "Trust in our brand has increased",
  ],
  COMPETITOR_ACTIVITY: [
    "Competitor launched new drug in market",
    "Rival company acquired major pharma firm",
    "Competition pricing strategy changed",
    "New competitor entered the market",
    "Competitor recall announced",
  ],
};

async function sendEvent(text, source = "spike-test") {
  try {
    const response = await axios.post(
      `${BACKEND_URL}${CLASSIFY_ENDPOINT}`,
      { text, source },
      { timeout: 5000 },
    );
    return { success: true, data: response.data };
  } catch (error) {
    let errorMsg = error.message;

    if (error.code === "ECONNREFUSED") {
      errorMsg = "Connection refused - backend not running";
    } else if (error.response) {
      errorMsg = `HTTP ${error.response.status}`;
      if (error.response.data?.error) {
        errorMsg += `: ${error.response.data.error}`;
      }
    }

    return { success: false, error: errorMsg };
  }
}

async function generateSpike(
  category = "SIDE_EFFECTS",
  count = 25,
  delayMs = 50,
) {
  console.log(`🚀 Generating spike: ${count} ${category} events`);
  console.log(`⏱️  Delay: ${delayMs}ms between events\n`);

  const texts = sampleTexts[category] || sampleTexts.SIDE_EFFECTS;
  let successCount = 0;
  let failCount = 0;
  let errors = {};

  for (let i = 0; i < count; i++) {
    const text = texts[i % texts.length];
    const result = await sendEvent(text);

    if (result.success) {
      successCount++;
      process.stdout.write(`✅ `);
    } else {
      failCount++;
      process.stdout.write(`❌ `);
      errors[result.error] = (errors[result.error] || 0) + 1;
    }

    if ((i + 1) % 10 === 0) {
      console.log(`(${i + 1}/${count})`);
    }

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.log(`\n\n📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  if (Object.keys(errors).length > 0) {
    console.log(`\n   Error summary:`);
    Object.entries(errors).forEach(([error, count]) => {
      console.log(`   - ${error}: ${count} times`);
    });
  }

  if (successCount > 0) {
    console.log(`\n💡 ${successCount} events created successfully!`);
    console.log(
      `   Check for trends: curl http://localhost:8001/debug/trends\n`,
    );
    return true;
  } else {
    console.log(`\n❌ All events failed. Common issues:`);
    console.log(`   1. Backend not running: npm run dev`);
    console.log(
      `   2. Wrong endpoint: Check if your route is POST ${CLASSIFY_ENDPOINT}`,
    );
    console.log(`   3. CORS issue: Check backend CORS settings\n`);
    return false;
  }
}

async function generateBaseline(
  category = "SIDE_EFFECTS",
  count = 5,
  delayMs = 500,
) {
  console.log(`📉 Generating baseline: ${count} ${category} events\n`);

  const texts = sampleTexts[category] || sampleTexts.SIDE_EFFECTS;
  let successCount = 0;

  for (let i = 0; i < count; i++) {
    const text = texts[i % texts.length];
    const result = await sendEvent(text, "baseline");

    if (result.success) {
      successCount++;
      process.stdout.write(`✓ `);
    } else {
      process.stdout.write(`✗ `);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  console.log(`\n✅ Baseline: ${successCount}/${count} succeeded\n`);
  return successCount > 0;
}

async function testConnection() {
  console.log(
    `🔍 Testing connection to ${BACKEND_URL}${CLASSIFY_ENDPOINT}...\n`,
  );

  const result = await sendEvent(
    "Test connection - ignore this event",
    "connection-test",
  );

  if (result.success) {
    console.log(`✅ Connection successful!`);
    console.log(`   Backend is ready at ${BACKEND_URL}${CLASSIFY_ENDPOINT}\n`);
    return true;
  } else {
    console.log(`❌ Connection failed: ${result.error}\n`);
    console.log(`🔧 Troubleshooting:`);
    console.log(`   1. Is backend running?`);
    console.log(
      `   2. Check the endpoint exists: POST ${BACKEND_URL}${CLASSIFY_ENDPOINT}\n`,
    );
    console.log(`   3. Check backend logs for errors\n`);
    return false;
  }
}

async function createRealisticSpike(category = "SIDE_EFFECTS") {
  console.log("═".repeat(60));
  console.log("🧪 REALISTIC SPIKE SCENARIO TEST");
  console.log("═".repeat(60) + "\n");

  const connected = await testConnection();
  if (!connected) {
    console.log("❌ Cannot continue - fix connection first.\n");
    return;
  }

  console.log("📍 Step 1: Creating baseline data...\n");
  const baselineOk = await generateBaseline(category, 5, 500);

  if (!baselineOk) {
    console.log("⚠️ Baseline failed but continuing anyway...\n");
  }

  console.log("⏳ Step 2: Waiting 2 seconds...\n");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("📍 Step 3: Creating SPIKE...\n");
  const spikeOk = await generateSpike(category, 25, 50);

  console.log("═".repeat(60));
  if (spikeOk) {
    console.log("✅ SPIKE SCENARIO COMPLETE!\n");
    console.log("Next steps:");
    console.log("1. Check trends: curl http://localhost:8001/debug/trends");
  } else {
    console.log("❌ SPIKE FAILED - Check errors above\n");
  }
  console.log("═".repeat(60) + "\n");
}

async function quickSpike(category = "SIDE_EFFECTS", count = 30) {
  console.log("⚡ QUICK SPIKE TEST\n");

  const connected = await testConnection();
  if (!connected) {
    console.log("❌ Cannot continue - fix connection first.\n");
    return;
  }

  await generateSpike(category, count, 50);
}

const args = process.argv.slice(2);
const command = args[0] || "realistic";

console.log(`📡 Target: ${BACKEND_URL}${CLASSIFY_ENDPOINT}`);
console.log(`🎯 Command: ${command}\n`);

switch (command) {
  case "test":
    testConnection();
    break;
  case "quick":
    quickSpike(args[1] || "SIDE_EFFECTS", parseInt(args[2]) || 30);
    break;
  case "realistic":
    createRealisticSpike(args[1] || "SIDE_EFFECTS");
    break;
  case "baseline":
    testConnection().then((ok) => {
      if (ok) generateBaseline(args[1] || "SIDE_EFFECTS", 5, 500);
    });
    break;
  case "spike":
    testConnection().then((ok) => {
      if (ok)
        generateSpike(args[1] || "SIDE_EFFECTS", parseInt(args[2]) || 20, 100);
    });
    break;
  default:
    console.log(`Usage: node spike-no-health.js [command] [options]`);
}
