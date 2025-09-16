import { elements, bindMenuHandlers } from "./dom.js";
import { PLACEHOLDERS, getTopicDisplayName } from "./constants.js";
import { appState } from "./state.js";
import { detectApiBase, getAiReplyOnline, updateFortuneOnDB, fetchFortunesFromServer } from "./api.js";
import { getUserInfoFromForm } from "./storage.js";
import { displayHistoryList, mapServerFortunes, mergeHistories } from "./history.js";
import { setChatState, showTypingIndicator, displayMessage, displayMessageWithTyping } from "./ui.js";

function saveCurrentChat() {}

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
    aiPrediction = `เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (${appState.apiBase}). ลองใหม่ภายหลัง`;
  }
  await displayMessageWithTyping(aiPrediction, "received", true, saveCurrentChat);
  if (serverId) appState.currentChatId = serverId;
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
  loadFortuneHistory();
}

async function loadFortuneHistory() {
  const serverFortunesRaw = await fetchFortunesFromServer();
  const serverFortunes = mapServerFortunes(serverFortunesRaw);
  appState.allHistories = [];
  mergeHistories(serverFortunes, []);
  displayHistoryList();
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
    loadFortuneHistory();
  });
  setChatState(false);
});


