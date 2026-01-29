const BASE_URL = "http://localhost:5000/api";

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
