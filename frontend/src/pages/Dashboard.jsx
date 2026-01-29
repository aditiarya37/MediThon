import { useState } from "react";
import ClassifyForm from "../components/ClassifyForm";
import EventsTable from "../components/EventsTable";
import TrendsPanel from "../components/TrendsPanel";

export default function Dashboard() {
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">PharmaRadar Dashboard</h1>

        <ClassifyForm onNewEvent={() => setRefresh((r) => r + 1)} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrendsPanel />
          <EventsTable refresh={refresh} />
        </div>
      </div>
    </div>
  );
}
