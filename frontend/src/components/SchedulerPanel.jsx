// frontend/src/components/SchedulerPanel.jsx
import { useEffect, useState } from "react";
import {
  getSchedulerStatus,
  triggerManualRun,
  pauseScheduler,
  resumeScheduler,
} from "../api/api";

export default function SchedulerPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await getSchedulerStatus();
      setStatus(data);
    } catch (err) {
      console.error("Failed to load scheduler status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // Refresh every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRun = async () => {
    setActionLoading(true);
    try {
      await triggerManualRun();
      alert("✅ Manual data fetch triggered! Check console for progress.");
      // Reload status after a delay
      setTimeout(loadStatus, 2000);
    } catch (err) {
      alert("❌ Failed to trigger manual run");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await pauseScheduler();
      loadStatus();
    } catch (err) {
      alert("❌ Failed to pause scheduler");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await resumeScheduler();
      loadStatus();
    } catch (err) {
      alert("❌ Failed to resume scheduler");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="bg-white rounded-xl shadow p-6 border-l-8 border-blue-500">
        <p className="text-gray-500">Loading scheduler status...</p>
      </div>
    );
  }

  const isActive = status?.isRunning === false && status?.activeJobs > 0;

  return (
    <div className="bg-white rounded-xl shadow p-6 border-l-8 border-blue-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">🤖 Automated Data Collection</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
          ></div>
          <span className="text-sm font-medium">
            {isActive ? "Active" : "Paused"}
          </span>
        </div>
      </div>

      {status && (
        <div className="space-y-3">
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Total Fetched</p>
              <p className="text-xl font-bold text-blue-600">
                {status.totalFetches || 0}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Total Classified</p>
              <p className="text-xl font-bold text-green-600">
                {status.totalClassified || 0}
              </p>
            </div>
          </div>

          {/* Last Run */}
          {status.lastRun && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Last Run</p>
              <p className="text-sm font-medium">
                {new Date(status.lastRun).toLocaleString()}
              </p>
            </div>
          )}

          {/* Recent Errors */}
          {status.recentErrors && status.recentErrors.length > 0 && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-xs text-red-600 font-medium mb-1">
                Recent Errors ({status.recentErrors.length})
              </p>
              <div className="text-xs text-red-700 max-h-20 overflow-y-auto">
                {status.recentErrors.slice(0, 3).map((err, i) => (
                  <div key={i} className="mb-1">
                    • {err.source}: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={handleManualRun}
              disabled={actionLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition"
            >
              {actionLoading ? "..." : "🔄 Manual Run"}
            </button>
            {isActive ? (
              <button
                onClick={handlePause}
                disabled={actionLoading}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium transition"
              >
                ⏸️ Pause
              </button>
            ) : (
              <button
                onClick={handleResume}
                disabled={actionLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition"
              >
                ▶️ Resume
              </button>
            )}
          </div>

          {/* Info */}
          <div className="bg-gray-50 p-3 rounded-lg mt-3">
            <p className="text-xs text-gray-600">
              ℹ️ Automated collection runs every <strong>2 hours</strong> from
              RSS feeds, clinical trials, FDA announcements, and PubMed
              research.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
