import { useEffect, useState } from "react";
import { fetchTrends } from "../api/api";

export default function TrendsPanel() {
  const [trends, setTrends] = useState([]);
  const [error, setError] = useState(null);

  // Define the fetch logic as a separate function we can call anytime
  const loadTrends = () => {
    console.log("🖱️ Manual Fetch Triggered...");

    fetchTrends()
      .then((data) => {
        console.log("✅ Fetch Success:", data);
        setTrends(data);
        setError(null);
      })
      .catch((err) => {
        console.error("❌ Fetch Failed:", err);
        setError("Failed to load trends. Check console.");
      });
  };

  useEffect(() => {
    console.log("🔵 useEffect running...");
    loadTrends();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6 border-l-8 border-red-500">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">🚨 Trend Alerts</h3>
        {/* MANUAL RETRY BUTTON */}
        <button
          onClick={loadTrends}
          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm font-bold text-gray-700 transition"
        >
          🔄 Retry
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {trends.length === 0 && !error && (
        <p className="text-gray-500">No abnormal trends detected</p>
      )}

      <div className="space-y-3">
        {trends.map((t, i) => (
          <div
            key={i}
            className="flex justify-between items-center bg-red-50 p-3 rounded-lg"
          >
            <span className="font-medium">{t.category}</span>
            {/* Ensure we use spikeScore (camelCase) */}
            <span className="text-red-600 font-semibold">
              {t.spikeScore ? t.spikeScore : "N/A"}x
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
