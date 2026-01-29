import axios from "axios";

const TREND_API_URL = "http://localhost:8001";

export const runTrendDetection = async () => {
  try {
    const res = await axios.post(`${TREND_API_URL}/detect-trends`);
    return res.data;
  } catch (err) {
    console.error("Trend detection failed:", err.message);
    return null; // do NOT crash main flow
  }
};
