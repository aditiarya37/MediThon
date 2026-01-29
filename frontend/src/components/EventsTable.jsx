import { useEffect, useState } from "react";
import { fetchEvents } from "../api/api";

export default function EventsTable({ refresh }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents().then(setEvents);
  }, [refresh]);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Classified Events</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Confidence</th>
              <th className="p-3 text-left">Text</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-b">
                <td className="p-3 font-medium">{e.category}</td>
                <td className="p-3">{(e.confidence * 100).toFixed(1)}%</td>
                <td className="p-3 text-gray-600">{e.text.slice(0, 60)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
