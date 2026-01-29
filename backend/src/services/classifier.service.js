import axios from "axios";

export const classifyText = async (text, source) => {
  const CLASSIFIER_BASE_URL = process.env.CLASSIFIER_API_URL;

  if (!CLASSIFIER_BASE_URL) {
    throw new Error("❌ CLASSIFIER_API_URL is not set at runtime");
  }

  const url = `${CLASSIFIER_BASE_URL}/classify`;

  console.log("Calling classifier at:", url);

  const response = await axios.post(url, {
    text,
    source,
  });

  return response.data;
};
