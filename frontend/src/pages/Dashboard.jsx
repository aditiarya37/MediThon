// frontend/src/pages/Dashboard.jsx (Updated)
import { useState } from "react";
import ClassifyForm from "../components/ClassifyForm";
import EventsTable from "../components/EventsTable";
import TrendsPanel from "../components/TrendsPanel";
import SchedulerPanel from "../components/SchedulerPanel";

export default function Dashboard() {
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">🔬 PharmaRadar Dashboard</h1>
          <p className="text-blue-100">
            Automated pharmaceutical trend detection and analysis
          </p>
        </div>

        {/* Top Row: Scheduler Status & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SchedulerPanel />
          <TrendsPanel />
        </div>

        {/* Manual Classification (Optional) */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-gray-300">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold">✍️ Manual Classification</h3>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
              Optional - For Testing
            </span>
          </div>
          <ClassifyForm onNewEvent={() => setRefresh((r) => r + 1)} />
        </div>

        {/* Events Table */}
        <EventsTable refresh={refresh} />

        {/* Footer Info */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">📊 Data Sources</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-blue-800">
            <div>📰 Pharma News RSS</div>
            <div>🔬 Clinical Trials</div>
            <div>⚖️ FDA/EMA Announcements</div>
            <div>📚 PubMed Research</div>
          </div>
        </div>
      </div>
    </div>
  );
}
