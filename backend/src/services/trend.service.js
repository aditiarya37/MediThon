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
        timeout: 10000, // 10 second timeout
      },
    );

    console.log(`✅ Trend detection response:`, res.data);
    return res.data;
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      console.error(
        `❌ Trend detection failed: Cannot connect to ${TREND_API_URL}`,
      );
      console.error(
        `   Make sure the Python trend detection service is running on port 8001`,
      );
    } else if (err.response) {
      console.error(
        `❌ Trend detection failed with status ${err.response.status}:`,
        err.response.data,
      );
    } else {
      console.error(`❌ Trend detection failed:`, err.message);
    }
    throw err; // Re-throw so caller can handle it
  }
};
