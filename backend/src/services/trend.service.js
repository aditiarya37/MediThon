// backend/src/services/trend.service.js
import axios from "axios";

const TREND_API_URL = process.env.TREND_API_URL || "http://localhost:8001";

export const runTrendDetection = async () => {
  try {
    console.log(
      `🔍 Calling trend detection API at: ${TREND_API_URL}/detect-trends`,
    );

    const res = await axios.post(
      `${TREND_API_URL}/detect-trends`,
      {},
      {
        timeout: 60000, // Increased to 60 seconds for heavy computation
      },
    );

    console.log(`✅ Trend detection response:`, res.data);
    return res.data;
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      console.error(
        `❌ Trend detection failed: Cannot connect to ${TREND_API_URL}`,
      );
    } else {
      console.error(`❌ Trend detection failed:`, err.message);
    }
    throw err;
  }
};
