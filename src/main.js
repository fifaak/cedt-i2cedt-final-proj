import { elements, bindMenuHandlers } from "./dom.js";
import { PLACEHOLDERS, LS_KEYS, getTopicDisplayName } from "./constants.js";
import { appState } from "./state.js";
import { detectApiBase, getAiReplyOnline, getAiReplyViaChat, updateFortuneOnDB, fetchFortunesFromServer } from "./api.js";
import { getUserInfoFromForm, saveUserInfoToLocal, loadUserInfoFromLocal, addPendingFortune, findPendingById, setPendingFortunes, getPendingFortunes, saveChatHistoryToLocal, loadChatHistoryFromLocal } from "./storage.js";
import { displayHistoryList, mapServerFortunes, mergeHistories, handleDeleteChat, loadSpecificChat } from "./history.js";
import { setChatState, showTypingIndicator, removeTypingIndicator, displayMessage, displayMessageWithTyping } from "./ui.js";
import { startBackgroundSync } from "./sync.js";

function saveCurrentChat() {
  if (!appState.isUserInfoSubmitted) return;
  saveUserInfoToLocal();
  const messages = [];
  elements.chatContainer.querySelectorAll(".message").forEach((bubble) => {
    const msgElement = bubble.querySelector("p");
    if (msgElement && !bubble.classList.contains("typing")) {
      messages.push({
        text: msgElement.textContent,
        type: bubble.classList.contains("sent") ? "sent" : "received",
      });
    }
  });
  if (messages.length === 0) return;
  const existingIndex = appState.allHistories.findIndex((h) => h.id === appState.currentChatId);
  let chatSessionData;
  if (existingIndex > -1) {
    chatSessionData = {
      ...appState.allHistories[existingIndex],
      lastMessageTime: new Date().toLocaleString("th-TH"),
      messages,
      userInfo: getUserInfoFromForm(),
    };
    appState.allHistories.splice(existingIndex, 1);
  } else {
    const topicText = elements.topicSelect.options[elements.topicSelect.selectedIndex].text;
    chatSessionData = {
      id: appState.currentChatId,
      topic: topicText,
      lastMessageTime: new Date().toLocaleString("th-TH"),
      messages,
      userInfo: getUserInfoFromForm(),
      source: String(appState.currentChatId).startsWith("local-") ? "local" : "server",
    };
  }
  appState.allHistories.unshift(chatSessionData);
  displayHistoryList();
  saveChatHistoryToLocal(appState.allHistories, appState.currentChatId);
}

async function handleSendMessage() {
  if (!appState.isUserInfoSubmitted || appState.isReplying) return;
  const userMessage = elements.messageInput.value.trim();
  if (!userMessage) return;
  const userInfo = getUserInfoFromForm();
  displayMessage(userMessage, "sent", true, saveCurrentChat);
  elements.messageInput.value = "";
  appState.isReplying = true;
  elements.messageInput.disabled = true;
  elements.sendBtn.disabled = true;
  elements.messageInput.placeholder = PLACEHOLDERS.LOADING;
  showTypingIndicator();
  let aiPrediction = "";
  let serverId = null;
  try {
    const data = await getAiReplyOnline(userMessage, userInfo);
    serverId = data.id || null;
    aiPrediction = data.prediction || "";
  } catch (err) {
    try {
      const data = await getAiReplyViaChat(userMessage, userInfo);
      aiPrediction = data.prediction || "";
    } catch (e2) {
      aiPrediction = `เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (${appState.apiBase}). ลองใหม่ภายหลัง`;
    }
  }
  await displayMessageWithTyping(aiPrediction, "received", true, saveCurrentChat);
  if (serverId) {
    appState.currentChatId = serverId;
  } else {
    if (!appState.currentChatId || !String(appState.currentChatId).startsWith("local-")) {
      appState.currentChatId = `local-${Date.now()}`;
    }
    addPendingFortune({
      id: appState.currentChatId,
      userInfo: userInfo,
      text: userMessage,
      prediction: aiPrediction,
      created_at: new Date().toISOString(),
    });
  }
  appState.isReplying = false;
  elements.messageInput.disabled = false;
  elements.sendBtn.disabled = false;
  elements.messageInput.placeholder = PLACEHOLDERS.ENABLED;
  elements.messageInput.focus();
  saveCurrentChat();
}

function handleSidebarSubmit() {
  const isNameValid = elements.userNameInput.value.trim() !== "";
  const isGenderValid = elements.userGenderSelect.value !== "";
  const isDobValid = elements.userDobInput.value.trim() !== "";
  const isTopicValid = elements.topicSelect.value !== "";
  if (isNameValid && isGenderValid && isDobValid && isTopicValid) {
    appState.isUserInfoSubmitted = true;
    setChatState(true);
    elements.messageInput.focus();
    const selectedTopicText = elements.topicSelect.options[elements.topicSelect.selectedIndex].text;
    elements.headerTitle.textContent = selectedTopicText;
    saveUserInfoToLocal();
    saveCurrentChat();
    const originalText = elements.submitSidebarBtn.textContent;
    elements.submitSidebarBtn.textContent = "บันทึกแล้ว";
    elements.submitSidebarBtn.disabled = true;
    setTimeout(() => {
      elements.submitSidebarBtn.textContent = originalText;
      elements.submitSidebarBtn.disabled = false;
    }, 1200);
  } else {
    alert("กรอกข้อมูลให้ครบก่อน");
  }
}

function formatDobInput() {
  let value = elements.userDobInput.value.replace(/\D/g, "");
  if (value.length > 8) value = value.slice(0, 8);
  if (value.length > 4) value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
  else if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
  elements.userDobInput.value = value;
}

function resetApplication() {
  appState.isUserInfoSubmitted = false;
  appState.currentChatId = null;
  elements.messageInput.value = "";
  elements.chatContainer.innerHTML = "";
  elements.headerTitle.textContent = "ดูดวง";
  setChatState(false);
  loadUserInfoFromLocal();
  loadFortuneHistory();
  try { localStorage.removeItem(LS_KEYS.CURRENT_CHAT); } catch (e) {}
}

async function loadFortuneHistory() {
  const serverFortunesRaw = await fetchFortunesFromServer();
  const serverFortunes = mapServerFortunes(serverFortunesRaw);
  const pending = getPendingFortunes().map((p) => ({
    id: p.id,
    topic: getTopicDisplayName(p.userInfo.topicValue),
    lastMessageTime: new Date(p.created_at).toLocaleString("th-TH"),
    messages: [
      { text: p.text || "", type: "sent" },
      { text: p.prediction || "", type: "received" },
    ],
    userInfo: p.userInfo,
    source: "local",
  }));
  appState.allHistories = loadChatHistoryFromLocal();
  mergeHistories(serverFortunes, pending);
  displayHistoryList();
  saveChatHistoryToLocal(appState.allHistories, appState.currentChatId);
}

function bindEvents() {
  elements.submitSidebarBtn.addEventListener("click", handleSidebarSubmit);
  elements.newChatBtn.addEventListener("click", resetApplication);
  elements.chatForm.addEventListener("submit", (e) => { e.preventDefault(); handleSendMessage(); });
  elements.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  });
  elements.messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 200) + "px";
  });
  if (elements.userDobInput) elements.userDobInput.addEventListener("input", formatDobInput);
  elements.topicSelect.addEventListener("change", () => {
    elements.headerTitle.textContent = elements.topicSelect.options[elements.topicSelect.selectedIndex].text;
    saveCurrentChat();
    saveUserInfoToLocal();
  });
  elements.userNameInput.addEventListener("input", () => { saveCurrentChat(); saveUserInfoToLocal(); });
  elements.userGenderSelect.addEventListener("change", () => { saveCurrentChat(); saveUserInfoToLocal(); });
  elements.userDobInput.addEventListener("input", () => { saveCurrentChat(); saveUserInfoToLocal(); });
}

document.addEventListener("DOMContentLoaded", () => {
  bindMenuHandlers();
  bindEvents();
  detectApiBase().then(() => {
    loadUserInfoFromLocal();
    loadFortuneHistory();
    setTimeout(() => {
      const savedCurrentChat = localStorage.getItem(LS_KEYS.CURRENT_CHAT);
      if (savedCurrentChat && appState.allHistories.find((h) => h.id === savedCurrentChat)) {
        import("./history.js").then(({ loadSpecificChat }) => loadSpecificChat(savedCurrentChat));
      }
    }, 100);
    startBackgroundSync();
  });
  setChatState(false);
});


