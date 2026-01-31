import { useEffect, useState } from "react";
import { fetchEvents } from "../api/api";

export default function EventsTable({ refresh }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [refresh]);

  // Category colors
  const getCategoryColor = (category) => {
    const colors = {
      BRAND_PERCEPTION: "bg-purple-100 text-purple-700",
      SIDE_EFFECTS: "bg-red-100 text-red-700",
      COMPETITOR_ACTIVITY: "bg-blue-100 text-blue-700",
      REGULATION_POLICY: "bg-yellow-100 text-yellow-700",
      CLINICAL_TRIALS: "bg-green-100 text-green-700",
      MARKETING_PROMOTION: "bg-pink-100 text-pink-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  // Format category name
  const formatCategory = (category) => {
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Get confidence badge color
  const getConfidenceBadge = (confidence) => {
    const percent = confidence * 100;
    if (percent >= 90) return "bg-green-500 text-white";
    if (percent >= 70) return "bg-blue-500 text-white";
    if (percent >= 50) return "bg-yellow-500 text-white";
    return "bg-gray-500 text-white";
  };

  // Extract source type and name
  const formatSource = (source) => {
    const parts = source.split(":");
    if (parts.length === 2) {
      return {
        type: parts[0],
        name: parts[1],
      };
    }
    return { type: "unknown", name: source };
  };

  // Filter and sort events
  let filteredEvents = events;
  if (filter !== "ALL") {
    filteredEvents = events.filter((e) => e.category === filter);
  }

  if (sortBy === "recent") {
    filteredEvents = [...filteredEvents].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  } else if (sortBy === "confidence") {
    filteredEvents = [...filteredEvents].sort(
      (a, b) => b.confidence - a.confidence,
    );
  }

  // Get category counts
  const categoryCounts = events.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">📊 Classified Events</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filteredEvents.length} of {events.length} events
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="confidence">Highest Confidence</option>
          </select>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All Categories ({events.length})</option>
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <option key={cat} value={cat}>
                {formatCategory(cat)} ({count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {Object.entries(categoryCounts).map(([category, count]) => (
          <div
            key={category}
            className={`${getCategoryColor(category)} p-2 rounded text-center cursor-pointer hover:shadow transition`}
            onClick={() => setFilter(category)}
          >
            <p className="text-xs font-medium">{formatCategory(category)}</p>
            <p className="text-xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No events found for this filter
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="p-3 text-left font-semibold">Category</th>
                <th className="p-3 text-left font-semibold">Confidence</th>
                <th className="p-3 text-left font-semibold">Source</th>
                <th className="p-3 text-left font-semibold">Preview</th>
                <th className="p-3 text-left font-semibold">Date</th>
                <th className="p-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((e, i) => {
                const source = formatSource(e.source);
                const isExpanded = selectedEvent === i;

                return (
                  <>
                    <tr
                      key={i}
                      className="border-b hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => setSelectedEvent(isExpanded ? null : i)}
                    >
                      <td className="p-3">
                        <span
                          className={`${getCategoryColor(e.category)} px-3 py-1 rounded-full text-xs font-medium inline-block`}
                        >
                          {formatCategory(e.category)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`${getConfidenceBadge(e.confidence)} px-2 py-1 rounded text-xs font-bold`}
                        >
                          {(e.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-xs">
                          <p className="font-medium text-gray-700">
                            {source.type}
                          </p>
                          <p className="text-gray-500 truncate max-w-[150px]">
                            {source.name}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-gray-600 truncate max-w-[300px]">
                          {e.text}
                        </p>
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(e.createdAt).toLocaleDateString()}
                        <br />
                        {new Date(e.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            setSelectedEvent(isExpanded ? null : i);
                          }}
                        >
                          {isExpanded ? "▲ Hide" : "▼ View"}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr className="bg-blue-50 border-b">
                        <td colSpan="6" className="p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                Full Text
                              </p>
                              <p className="text-sm text-gray-800 leading-relaxed">
                                {e.text}
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-gray-600">
                                  Category
                                </p>
                                <p className="text-sm text-gray-800">
                                  {formatCategory(e.category)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-600">
                                  Confidence Score
                                </p>
                                <p className="text-sm text-gray-800">
                                  {(e.confidence * 100).toFixed(2)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-600">
                                  Source
                                </p>
                                <p className="text-sm text-gray-800">
                                  {e.source}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-600">
                                Classified At
                              </p>
                              <p className="text-sm text-gray-800">
                                {new Date(e.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination hint (optional) */}
      {filteredEvents.length > 50 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing first {filteredEvents.length} events. Use filters to narrow
          results.
        </div>
      )}
    </div>
  );
}
