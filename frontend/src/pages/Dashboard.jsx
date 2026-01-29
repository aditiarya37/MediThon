import React, { useEffect, useState } from "react";

const Dashboard = () => {
  // Placeholder for backend data
  const [backendMessage, setBackendMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.message))
      .catch((err) => setBackendMessage("Backend disconnected"));
  }, []);

  return (
    <div className="space-y-6">
      {/* Backend Status Alert */}
      <div
        className={`p-4 rounded-lg border ${backendMessage.includes("Running") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}
      >
        <strong>System Status: </strong> {backendMessage}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value="1,240"
          trend="+12%"
          color="blue"
        />
        <StatCard title="Appointments" value="48" trend="+5%" color="indigo" />
        <StatCard
          title="Pending Reports"
          value="12"
          trend="-2%"
          color="orange"
        />
        <StatCard title="Revenue" value="$14k" trend="+8%" color="emerald" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-lg text-slate-800 mb-4">
            Patient Activity
          </h3>
          <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            Chart / Graph Placeholder
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-lg text-slate-800 mb-4">
            Recent Alerts
          </h3>
          <div className="space-y-4">
            <AlertItem
              text="New lab results available for John Doe"
              time="2m ago"
            />
            <AlertItem
              text="Appointment cancelled: Sarah Smith"
              time="1h ago"
            />
            <AlertItem text="System maintenance scheduled" time="5h ago" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components for cleaner code
const StatCard = ({ title, value, trend, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
      </div>
      <span
        className={`text-xs font-medium px-2 py-1 rounded-full bg-${color}-50 text-${color}-600`}
      >
        {trend}
      </span>
    </div>
  </div>
);

const AlertItem = ({ text, time }) => (
  <div className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0">
    <div className="w-2 h-2 mt-2 bg-red-400 rounded-full flex-shrink-0"></div>
    <div>
      <p className="text-sm text-slate-700">{text}</p>
      <span className="text-xs text-slate-400">{time}</span>
    </div>
  </div>
);

export default Dashboard;
