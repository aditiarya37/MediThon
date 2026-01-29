import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👇 EXPLICIT path to backend/.env
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

import app from "./app.js";

const PORT = process.env.PORT || 5000;

console.log("CLASSIFIER_API_URL =", process.env.CLASSIFIER_API_URL);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
