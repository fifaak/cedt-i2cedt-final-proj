// Centralized mutable state

export const appState = {
  apiBase: "/api",
  isReplying: false,
  isUserInfoSubmitted: false,
  currentChatId: null, // backend id or local-xxx
  currentSessionKey: null, // grouped session key (name|dob|sex|topic)
  lastFortuneId: null, // last server fortune id for updates
  allHistories: [],
  syncIntervalId: null,
};

export function setApiBase(base) {
  appState.apiBase = base;
}


