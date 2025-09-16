// Centralized mutable state

export const appState = {
  apiBase: "/api",
  isReplying: false,
  isUserInfoSubmitted: false,
  currentChatId: null, // backend id or local-xxx
  allHistories: [],
  syncIntervalId: null,
};

export function setApiBase(base) {
  appState.apiBase = base;
}


