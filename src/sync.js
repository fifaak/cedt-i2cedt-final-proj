import { appState } from "./state.js";
import { getPendingFortunes, setPendingFortunes } from "./storage.js";

export async function trySyncPendingOnce() {
  try {
    const health = await fetch(`${appState.apiBase}/health`).then((r) => r.json());
    if (!health || health.status !== "OK") return;
  } catch (_) {
    return;
  }
  const pending = getPendingFortunes();
  if (!pending.length) return;
  const remaining = [];
  for (const item of pending) {
    try {
      const res = await fetch(`${appState.apiBase}/fortune`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.userInfo.name,
          birthdate: item.userInfo.dob,
          sex: item.userInfo.gender,
          topic: item.userInfo.topicValue,
          text: item.text,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      if (appState.currentChatId === item.id) appState.currentChatId = data.id;
    } catch (e) {
      remaining.push(item);
    }
  }
  setPendingFortunes(remaining);
}

export function startBackgroundSync() {
  if (appState.syncIntervalId) return;
  appState.syncIntervalId = setInterval(trySyncPendingOnce, 10000);
}


