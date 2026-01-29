import { useState } from "react";
import { classifyText } from "../api/api";

export default function ClassifyForm({ onNewEvent }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await classifyText(text);
    setText("");
    setLoading(false);
    onNewEvent();
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold mb-3">Classify Pharma Text</h3>

      <textarea
        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
        placeholder="Enter pharma-related text..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Classifying..." : "Classify"}
      </button>
    </div>
  );
}
