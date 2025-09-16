import { setApiBase, appState } from "./state.js";

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export async function detectApiBase() {
  const override = getQueryParam("api");
  const host = window.location.hostname;
  const candidates = [];
  if (override) candidates.push(override.replace(/\/$/, ""));
  candidates.push("/api");
  candidates.push(`http://${host}:3001/api`);
  candidates.push("http://localhost:3001/api");
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/health`, { method: "GET" });
      if (res.ok) {
        setApiBase(base);
        return base;
      }
    } catch (_) {}
  }
  return null;
}

export async function getAiReplyOnline(userMessage, userInfo) {
  const response = await fetch(`${appState.apiBase}/fortune`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: userInfo.name,
      birthdate: userInfo.dob,
      sex: userInfo.gender,
      topic: userInfo.topicValue,
      text: userMessage,
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function getAiReplyViaChat(userMessage, userInfo) {
  const response = await fetch(`${appState.apiBase}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: userMessage,
      userInfo: {
        name: userInfo.name,
        birthdate: userInfo.dob,
        sex: userInfo.gender,
        topic: userInfo.topicValue,
      },
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function updateFortuneOnDB(fortuneId, userInfo, newText) {
  try {
    const response = await fetch(`${appState.apiBase}/fortune/${fortuneId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userInfo.name,
        birthdate: userInfo.dob,
        sex: userInfo.gender,
        topic: userInfo.topicValue,
        text: newText,
      }),
    });
    if (!response.ok) throw new Error("Failed to update");
    const data = await response.json();
    return data.prediction;
  } catch (e) {
    console.error("Error updating fortune:", e);
    return null;
  }
}

export async function deleteFortuneFromDB(fortuneId) {
  try {
    const response = await fetch(`${appState.apiBase}/fortune/${fortuneId}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    console.error("Error deleting from DB:", error);
    return false;
  }
}

export async function fetchFortunesFromServer() {
  try {
    const response = await fetch(`${appState.apiBase}/fortune`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.fortunes || [];
  } catch (_) {
    return [];
  }
}


