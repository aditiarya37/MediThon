import axios from "axios";

const CLASSIFIER_API = process.env.CLASSIFIER_API_URL;

export const classifyText = async (text, source) => {
  const response = await axios.post(`${CLASSIFIER_API}/classify`, {
    text,
    source,
  });

  return response.data;
  // { category: "...", confidence: 0.78 }
};
