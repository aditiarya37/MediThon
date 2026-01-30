import { useEffect, useState } from "react";
import { fetchTrends } from "../api/api";

export default function TrendsPanel() {
  const [trends, setTrends] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Added loading state

  const loadTrends = () => {
    setLoading(true);
    fetchTrends()
      .then((data) => {
        // Ensure data is an array before setting state
        setTrends(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => {
        setError("Failed to load trends.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTrends();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6 border-l-8 border-red-500">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">🚨 Trend Alerts</h3>
        <button
          onClick={loadTrends}
          disabled={loading}
          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm font-bold text-gray-700 transition disabled:opacity-50"
        >
          {loading ? "..." : "🔄 Retry"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {!loading && trends.length === 0 && !error && (
        <p className="text-gray-500">No abnormal trends detected</p>
      )}

      <div className="space-y-3">
        {trends.map((t, i) => (
          <div
            key={t.id || i}
            className="flex justify-between items-center bg-red-50 p-3 rounded-lg"
          >
            <span className="font-medium">{t.category}</span>
            <span className="text-red-600 font-semibold">
              {t.spikeScore ? `${t.spikeScore}x` : "N/A"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
