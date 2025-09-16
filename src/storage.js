import { LS_KEYS } from "./constants.js";
import { elements } from "./dom.js";

export function getUserInfoFromForm() {
  return {
    name: elements.userNameInput.value,
    gender: elements.userGenderSelect.value,
    dob: elements.userDobInput.value,
    topicValue: elements.topicSelect.value,
  };
}

export function saveUserInfoToLocal() {
  const info = getUserInfoFromForm();
  try {
    localStorage.setItem(LS_KEYS.USER_INFO, JSON.stringify(info));
  } catch (_) {}
}

export function loadUserInfoFromLocal() {
  try {
    const raw = localStorage.getItem(LS_KEYS.USER_INFO);
    if (!raw) return;
    const info = JSON.parse(raw);
    if (info.name) elements.userNameInput.value = info.name;
    if (info.gender) elements.userGenderSelect.value = info.gender;
    if (info.dob) elements.userDobInput.value = info.dob;
    if (info.topicValue) elements.topicSelect.value = info.topicValue;
  } catch (_) {}
}

export function getPendingFortunes() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.PENDING) || "[]");
  } catch (_) {
    return [];
  }
}

export function setPendingFortunes(list) {
  try {
    localStorage.setItem(LS_KEYS.PENDING, JSON.stringify(list));
  } catch (_) {}
}

export function addPendingFortune(item) {
  const list = getPendingFortunes();
  list.unshift(item);
  setPendingFortunes(list);
}

export function removePendingFortuneById(id) {
  const list = getPendingFortunes().filter((x) => x.id !== id);
  setPendingFortunes(list);
}

export function findPendingById(id) {
  return getPendingFortunes().find((x) => x.id === id);
}

export function saveChatHistoryToLocal(allHistories, currentChatId) {
  try {
    localStorage.setItem(LS_KEYS.CHAT_HISTORY, JSON.stringify(allHistories));
    if (currentChatId) {
      localStorage.setItem(LS_KEYS.CURRENT_CHAT, currentChatId);
    }
  } catch (e) {
    console.warn("Failed to save chat history to localStorage:", e);
  }
}

export function loadChatHistoryFromLocal() {
  try {
    const savedHistory = localStorage.getItem(LS_KEYS.CHAT_HISTORY);
    if (!savedHistory) return [];
    const parsedHistory = JSON.parse(savedHistory);
    return parsedHistory.filter((chat) => chat && chat.id && chat.messages && Array.isArray(chat.messages));
  } catch (e) {
    console.warn("Failed to load chat history from localStorage:", e);
    return [];
  }
}


