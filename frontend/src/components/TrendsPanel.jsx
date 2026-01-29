import { useEffect, useState } from "react";
import { fetchTrends } from "../api/api";

export default function TrendsPanel() {
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    fetchTrends().then(setTrends);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6 border-l-8 border-red-500">
      <h3 className="text-lg font-semibold mb-3">🚨 Trend Alerts</h3>

      {trends.length === 0 && (
        <p className="text-gray-500">No abnormal trends detected</p>
      )}

      <div className="space-y-3">
        {trends.map((t, i) => (
          <div
            key={i}
            className="flex justify-between items-center bg-red-50 p-3 rounded-lg"
          >
            <span className="font-medium">{t.category}</span>
            <span className="text-red-600 font-semibold">{t.spike_score}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}
