import { elements, bindMenuHandlers } from "./dom.js";
import { PLACEHOLDERS, getTopicDisplayName } from "./constants.js";
import { appState } from "./state.js";
import { detectApiBase, getAiReplyOnline, updateFortuneOnDB, fetchFortunesFromServer } from "./api.js";
import { getUserInfoFromForm } from "./storage.js";
import { displayHistoryList, mapServerFortunes, mergeHistories } from "./history.js";
import { setChatState, showTypingIndicator, displayMessage, displayMessageWithTyping } from "./ui.js";

// --- Validation helpers (must match DATA_SCHEMA.md) ---
const ALLOWED_SEX = ["male", "female", "other"];
const ALLOWED_TOPIC = ["overall", "career", "finance", "love", "health"];

function isValidDateDDMMYYYY(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const [dd, mm, yyyy] = value.split("/").map((v) => parseInt(v, 10));
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

function validateUserInfo(userInfo) {
  const errors = [];
  // name
  const name = (userInfo.name || "").trim();
  if (!name) errors.push("กรอกชื่อให้ครบถ้วน");
  else if (name.length > 100) errors.push("ชื่อยาวเกิน 100 ตัวอักษร");
  // birthdate
  const dob = (userInfo.dob || "").trim();
  if (!dob) errors.push("กรอกวันเดือนปีเกิดให้ครบถ้วน");
  else if (!isValidDateDDMMYYYY(dob)) errors.push("รูปแบบวันเกิดไม่ถูกต้อง (DD/MM/YYYY)");
  // sex
  if (!ALLOWED_SEX.includes(userInfo.gender)) errors.push("เพศไม่ถูกต้อง");
  // topic
  if (!ALLOWED_TOPIC.includes(userInfo.topicValue)) errors.push("หัวข้อไม่ถูกต้อง");
  return errors;
}

function validateMessage(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return ["พิมพ์ข้อความก่อนส่ง"]; 
  if (trimmed.length > 2000) return ["ข้อความยาวเกิน 2000 ตัวอักษร"]; 
  return [];
}

function saveCurrentChat() {}

async function handleSendMessage() {
  if (!appState.isUserInfoSubmitted || appState.isReplying) return;
  const userMessage = elements.messageInput.value.trim();
  if (!userMessage) return;
  const userInfo = getUserInfoFromForm();
  // Validate against schema
  const infoErrors = validateUserInfo(userInfo);
  const msgErrors = validateMessage(userMessage);
  const allErrors = [...infoErrors, ...msgErrors];
  if (allErrors.length) {
    alert(allErrors.join("\n"));
    return;
  }
  const sentEl = displayMessage(userMessage, "sent", true, saveCurrentChat);
  attachEditOnSentMessage(sentEl.querySelector("p"));
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

function attachEditOnSentMessage(pEl) {
  if (!pEl) return;
  pEl.style.cursor = "text";
  pEl.title = "คลิกเพื่อแก้ไขและขอคำทำนายใหม่";
  pEl.addEventListener("click", async () => {
    if (!appState.currentChatId) {
      alert("ยังไม่มีรหัสแชทจากเซิร์ฟเวอร์ ไม่สามารถอัปเดตได้");
      return;
    }
    const original = pEl.textContent;
    const updated = prompt("แก้ไขข้อความของคุณ:", original);
    if (updated == null) return;
    const msgErrors = validateMessage(updated);
    if (msgErrors.length) {
      alert(msgErrors.join("\n"));
      return;
    }
    if (updated === original) return;

    // Visual disable send controls
    elements.messageInput.disabled = true;
    elements.sendBtn.disabled = true;

    // Show typing indicator and remove last received message (if any)
    showTypingIndicator();
    const lastReceived = Array.from(
      elements.chatContainer.querySelectorAll(".message.received")
    ).filter((el) => !el.classList.contains("typing")).pop();
    if (lastReceived) lastReceived.remove();

    // Update text in bubble
    pEl.textContent = updated.trim();

    const userInfo = getUserInfoFromForm();
    const infoErrors = validateUserInfo(userInfo);
    if (infoErrors.length) {
      alert(infoErrors.join("\n"));
      elements.messageInput.disabled = false;
      elements.sendBtn.disabled = false;
      return;
    }

    const newPrediction = await updateFortuneOnDB(
      appState.currentChatId,
      userInfo,
      updated.trim()
    );
    if (newPrediction) {
      await displayMessageWithTyping(newPrediction, "received", true, saveCurrentChat);
    } else {
      alert("อัปเดตไม่สำเร็จ กรุณาลองใหม่");
    }

    elements.messageInput.disabled = false;
    elements.sendBtn.disabled = false;
  });
}

function handleSidebarSubmit() {
  const userInfo = getUserInfoFromForm();
  const errors = validateUserInfo(userInfo);
  if (errors.length === 0) {
    appState.isUserInfoSubmitted = true;
    setChatState(true);
    elements.messageInput.focus();
    const selectedTopicText = elements.topicSelect.options[elements.topicSelect.selectedIndex].text;
    elements.headerTitle.textContent = selectedTopicText;
    saveCurrentChat();
    const originalText = elements.submitSidebarBtn.textContent;
    elements.submitSidebarBtn.textContent = "บันทึกแล้ว";
    elements.submitSidebarBtn.disabled = true;
    setTimeout(() => {
      elements.submitSidebarBtn.textContent = originalText;
      elements.submitSidebarBtn.disabled = false;
    }, 1200);
  } else {
    alert(errors.join("\n"));
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
    if (this.value.length > 2000) {
      this.value = this.value.slice(0, 2000);
    }
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


