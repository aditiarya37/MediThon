const BASE_URL = "http://localhost:5000/api";

// --- Classification & Data ---
export async function classifyText(text) {
  const res = await fetch(`${BASE_URL}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      source: "frontend",
    }),
  });
  return res.json();
}

export async function fetchEvents() {
  const res = await fetch(`${BASE_URL}/events`);
  return res.json();
}

export async function fetchTrends() {
  const res = await fetch(`${BASE_URL}/trends`);
  return res.json();
}

// --- Scheduler Management (Fixes the SyntaxError) ---
export async function getSchedulerStatus() {
  const res = await fetch(`${BASE_URL}/scheduler/status`);
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function triggerManualRun() {
  const res = await fetch(`${BASE_URL}/scheduler/run`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to trigger run");
  return res.json();
}

export async function pauseScheduler() {
  const res = await fetch(`${BASE_URL}/scheduler/pause`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to pause");
  return res.json();
}

export async function resumeScheduler() {
  const res = await fetch(`${BASE_URL}/scheduler/resume`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to resume");
  return res.json();
}
