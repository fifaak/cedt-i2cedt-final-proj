import { elements } from "./dom.js";
import { appState } from "./state.js";
import { getTopicDisplayName } from "./constants.js";
import { deleteFortuneFromDB } from "./api.js";

export function displayHistoryList() {
  elements.historyList.innerHTML = "";
  appState.allHistories.forEach((chat) => {
    const li = document.createElement("li");
    li.dataset.id = chat.id;
    const chatInfo = document.createElement("div");
    chatInfo.className = "chat-info";
    const prefix = chat.source === "local" ? "[Local] " : "";
    chatInfo.innerHTML = `${prefix}${chat.topic}<small>${chat.lastMessageTime}</small>`;
    chatInfo.addEventListener("click", () => loadSpecificChat(chat.id));
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-chat-btn";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.title = "ลบแชทนี้";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleDeleteChat(chat.id);
    });
    li.appendChild(chatInfo);
    li.appendChild(deleteBtn);
    elements.historyList.appendChild(li);
  });
}

export function loadSpecificChat(chatId) {
  const chatToLoad = appState.allHistories.find((h) => h.id == chatId);
  if (!chatToLoad) return;
  elements.headerTitle.textContent = chatToLoad.topic;
  elements.chatContainer.innerHTML = "";
  chatToLoad.messages.forEach((msg) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", msg.type);
    const p = document.createElement("p");
    p.textContent = msg.text;
    messageDiv.appendChild(p);
    elements.chatContainer.appendChild(messageDiv);
  });
  if (chatToLoad.userInfo) {
    elements.userNameInput.value = chatToLoad.userInfo.name;
    elements.userGenderSelect.value = chatToLoad.userInfo.gender;
    elements.userDobInput.value = chatToLoad.userInfo.dob;
    elements.topicSelect.value = chatToLoad.userInfo.topicValue;
  }
  appState.currentChatId = chatId;
  appState.isUserInfoSubmitted = true;
}

export async function handleDeleteChat(chatId) {
  const confirmDelete = confirm("คุณแน่ใจหรือไม่ที่จะลบแชทนี้? การกระทำนี้ไม่สามารถย้อนกลับได้");
  if (!confirmDelete) return;
  const success = await deleteFortuneFromDB(chatId);
  appState.allHistories = appState.allHistories.filter((chat) => chat.id !== chatId);
  displayHistoryList();
  if (appState.currentChatId === chatId) {
    appState.currentChatId = null;
  }
  alert(success ? "ลบแชทเรียบร้อยแล้ว" : "ลบเฉพาะในเครื่องแล้ว (ฐานข้อมูลไม่พร้อม)");
}

export function mergeHistories(serverFortunes, pending) {
  const existingIds = new Set(appState.allHistories.map((h) => h.id));
  const newServerFortunes = serverFortunes.filter((sf) => !existingIds.has(sf.id));
  appState.allHistories = [...appState.allHistories, ...newServerFortunes]
    .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
}

export function mapServerFortunes(fortunes) {
  return fortunes.map((fortune) => ({
    id: fortune.id,
    topic: getTopicDisplayName(fortune.topic),
    lastMessageTime: new Date(fortune.created_at).toLocaleString("th-TH"),
    messages: [
      { text: fortune.text || "", type: "sent" },
      { text: fortune.prediction || "", type: "received" },
    ],
    userInfo: {
      name: fortune.name,
      gender: fortune.sex,
      dob: fortune.birthdate,
      topicValue: fortune.topic,
    },
    source: "server",
  }));
}


