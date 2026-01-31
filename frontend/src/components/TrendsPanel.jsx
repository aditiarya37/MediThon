import { useEffect, useState } from "react";
import { fetchTrends } from "../api/api";

export default function TrendsPanel() {
  const [trends, setTrends] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState(null);

  const loadTrends = () => {
    setLoading(true);
    fetchTrends()
      .then((data) => {
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
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadTrends, 120000);
    return () => clearInterval(interval);
  }, []);

  // Severity styling
  const getSeverityStyle = (severity) => {
    const styles = {
      CRITICAL: {
        bg: "bg-red-100",
        border: "border-red-500",
        text: "text-red-700",
        badge: "bg-red-500",
        emoji: "🚨",
      },
      HIGH: {
        bg: "bg-orange-100",
        border: "border-orange-500",
        text: "text-orange-700",
        badge: "bg-orange-500",
        emoji: "🔴",
      },
      MEDIUM: {
        bg: "bg-yellow-100",
        border: "border-yellow-500",
        text: "text-yellow-700",
        badge: "bg-yellow-500",
        emoji: "🟠",
      },
      LOW: {
        bg: "bg-blue-100",
        border: "border-blue-500",
        text: "text-blue-700",
        badge: "bg-blue-500",
        emoji: "🟡",
      },
    };
    return styles[severity] || styles.LOW;
  };

  // Format category name
  const formatCategory = (category) => {
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Trend direction icon
  const getTrendDirectionIcon = (direction) => {
    const icons = {
      surging: "📈",
      spiking: "⚡",
      elevated: "📊",
      declining: "📉",
      stable: "➡️",
    };
    return icons[direction] || "📊";
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 border-l-8 border-red-500">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">🚨 Trend Alerts</h3>
          {trends.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {trends.length} active trend{trends.length !== 1 ? "s" : ""}{" "}
              detected
            </p>
          )}
        </div>
        <button
          onClick={loadTrends}
          disabled={loading}
          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm font-bold text-gray-700 transition disabled:opacity-50"
        >
          {loading ? "..." : "🔄 Refresh"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {!loading && trends.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">
            ✅ No abnormal trends detected
          </p>
          <p className="text-gray-400 text-sm mt-2">
            All pharmaceutical metrics within normal ranges
          </p>
        </div>
      )}

      {/* Severity Summary */}
      {trends.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => {
            const count = trends.filter((t) => t.severity === sev).length;
            const style = getSeverityStyle(sev);
            return (
              <div
                key={sev}
                className={`${style.bg} ${style.border} border-l-4 p-2 rounded`}
              >
                <p className="text-xs text-gray-600 font-medium">
                  {sev.charAt(0) + sev.slice(1).toLowerCase()}
                </p>
                <p className={`text-xl font-bold ${style.text}`}>{count}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Trend Cards */}
      <div className="space-y-3">
        {trends.map((trend, i) => {
          const style = getSeverityStyle(trend.severity);
          const isExpanded = selectedTrend === i;

          return (
            <div
              key={trend.id || i}
              className={`${style.bg} ${style.border} border-l-4 p-4 rounded-lg cursor-pointer transition hover:shadow-md`}
              onClick={() => setSelectedTrend(isExpanded ? null : i)}
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{style.emoji}</span>
                    <h4 className={`font-semibold ${style.text}`}>
                      {formatCategory(trend.category)}
                    </h4>
                    <span
                      className={`${style.badge} text-white text-xs px-2 py-0.5 rounded-full`}
                    >
                      {trend.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className={style.text}>
                      <strong>{trend.spikeScore}x</strong> spike
                    </span>
                    <span className="text-gray-600">
                      {getTrendDirectionIcon(trend.trendDirection)}{" "}
                      {trend.trendDirection}
                    </span>
                    <span className="text-gray-600">
                      {trend.currentCount} events
                    </span>
                  </div>
                </div>

                <button
                  className="text-gray-400 hover:text-gray-600 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTrend(isExpanded ? null : i);
                  }}
                >
                  {isExpanded ? "▲ Less" : "▼ More"}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-300 space-y-3">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/50 p-2 rounded">
                      <p className="text-xs text-gray-600">Percent Increase</p>
                      <p className={`text-lg font-bold ${style.text}`}>
                        +{trend.percentIncrease?.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-white/50 p-2 rounded">
                      <p className="text-xs text-gray-600">Baseline</p>
                      <p className="text-lg font-medium text-gray-700">
                        {trend.baselineCount?.toFixed(1)} events
                      </p>
                    </div>
                  </div>

                  {/* Top Sources */}
                  {trend.topSources && trend.topSources.length > 0 && (
                    <div className="bg-white/50 p-3 rounded">
                      <p className="text-xs text-gray-600 font-medium mb-2">
                        📊 Top Sources
                      </p>
                      <div className="space-y-1">
                        {trend.topSources.map((src, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-700">{src.source}</span>
                            <span className={`font-medium ${style.text}`}>
                              {src.count} events
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Texts */}
                  {trend.sampleTexts && trend.sampleTexts.length > 0 && (
                    <div className="bg-white/50 p-3 rounded">
                      <p className="text-xs text-gray-600 font-medium mb-2">
                        📝 Sample Events
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {trend.sampleTexts.slice(0, 3).map((text, idx) => (
                          <p key={idx} className="text-xs text-gray-700">
                            • {text.substring(0, 120)}
                            {text.length > 120 ? "..." : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Info */}
                  <div className="bg-white/50 p-2 rounded">
                    <p className="text-xs text-gray-600">
                      ⏰ Detected:{" "}
                      {trend.detectedAt
                        ? new Date(trend.detectedAt).toLocaleString()
                        : "Just now"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {trend.comparisonPeriod || "vs baseline"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
