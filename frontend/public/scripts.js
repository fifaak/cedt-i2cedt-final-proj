document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Constants ---
  const elements = {
    chatForm: document.getElementById("chat-form"),
    messageInput: document.getElementById("message-input"),
    chatContainer: document.getElementById("chat-container"),
    sendBtn: document.getElementById("send-btn"),
    submitSidebarBtn: document.getElementById("submit-sidebar-btn"),
    userNameInput: document.getElementById("user-name"),
    userGenderSelect: document.getElementById("user-gender"),
    userDobInput: document.getElementById("user-dob"),
    topicSelect: document.getElementById("horoscope-topic"),
    newChatBtn: document.getElementById("new-chat-btn"),
    historyList: document.getElementById("history-list"),
    headerTitle: document.querySelector("header h1"),
    hamburger: document.getElementById("menu-toggle"),
  };
  const sidebar = document.getElementById("sidebar");
  const overlay = document.querySelector(".overlay");

  // Mobile/tablet sidebar handling
  const toggleMenu = () => {
    const isOpen = sidebar.classList.contains("active");
    elements.hamburger.classList.toggle("is-active");
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.style.overflow = !isOpen ? "hidden" : "";
    elements.hamburger.setAttribute("aria-expanded", (!isOpen).toString());
    sidebar.setAttribute("aria-hidden", isOpen.toString());
  };

  if (elements.hamburger) {
    elements.hamburger.addEventListener("click", toggleMenu);
    elements.hamburger.setAttribute("aria-expanded", "false");
    sidebar.setAttribute("aria-hidden", "true");
    overlay.addEventListener("click", toggleMenu);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("active"))
        toggleMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768 && sidebar.classList.contains("active"))
        toggleMenu();
    });
  }

  const PLACEHOLDERS = {
    DISABLED: "กรอกข้อมูลด้านซ้ายแล้วกดบันทึก",
    ENABLED: "พิมพ์คำถามที่นี่...",
    LOADING: "อาจารย์คมกำลังเพ่งดวง...",
  };

  // API Base URL - dynamic detection with manual override
  let API_BASE = "/api";
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
  async function detectApiBase() {
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
          API_BASE = base;
          return base;
        }
      } catch (e) {
        /* try next */
      }
    }
    return null;
  }

  // Offline/local storage keys
  const LS_KEYS = {
    USER_INFO: "userInfo",
    PENDING: "pendingFortunes",
    CHAT_HISTORY: "chatHistory",
    CURRENT_CHAT: "currentChat",
  };

  // --- 2. State Variables ---
  let isReplying = false;
  let isUserInfoSubmitted = false;
  let currentChatId = null; // backend id or local-xxx
  let allHistories = [];
  let syncIntervalId = null;

  // --- 3. Local storage helpers ---
  function getUserInfoFromForm() {
    return {
      name: elements.userNameInput.value,
      gender: elements.userGenderSelect.value,
      dob: elements.userDobInput.value,
      topicValue: elements.topicSelect.value,
    };
  }
  function saveUserInfoToLocal() {
    const info = getUserInfoFromForm();
    try {
      localStorage.setItem(LS_KEYS.USER_INFO, JSON.stringify(info));
    } catch (_) {}
  }
  function loadUserInfoFromLocal() {
    try {
      const raw = localStorage.getItem(LS_KEYS.USER_INFO);
      if (!raw) return;
      const info = JSON.parse(raw);
      if (info.name) elements.userNameInput.value = info.name;
      if (info.gender) elements.userGenderSelect.value = info.gender;
      if (info.dob) elements.userDobInput.value = info.dob;
      if (info.topicValue) elements.topicSelect.value = info.topicValue;
      elements.headerTitle.textContent =
        elements.topicSelect.options[elements.topicSelect.selectedIndex].text;
    } catch (_) {}
  }
  function getPendingFortunes() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEYS.PENDING) || "[]");
    } catch (_) {
      return [];
    }
  }
  function setPendingFortunes(list) {
    try {
      localStorage.setItem(LS_KEYS.PENDING, JSON.stringify(list));
    } catch (_) {}
  }
  function addPendingFortune(item) {
    const list = getPendingFortunes();
    list.unshift(item);
    setPendingFortunes(list);
  }
  function removePendingFortuneById(id) {
    const list = getPendingFortunes().filter((x) => x.id !== id);
    setPendingFortunes(list);
  }
  function findPendingById(id) {
    return getPendingFortunes().find((x) => x.id === id);
  }

  // --- 4. Backend calls ---
  async function getAiReplyOnline(userMessage, userInfo) {
    const response = await fetch(`${API_BASE}/fortune`, {
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
  async function createChatOnServer(firstMessage, userInfo) {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: getDeterministicUserId(userInfo),
        message: firstMessage,
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

  async function appendMessageToChat(chatId, content, userInfo) {
    const response = await fetch(`${API_BASE}/chat/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        role: "user",
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
  async function updateFortuneOnDB(fortuneId, userInfo, newText) {
    try {
      const response = await fetch(`${API_BASE}/fortune/${fortuneId}`, {
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
  async function deleteFortuneFromDB(fortuneId) {
    try {
      const response = await fetch(`${API_BASE}/fortune/${fortuneId}`, {
        method: "DELETE",
      });
      return response.ok;
    } catch (error) {
      console.error("Error deleting from DB:", error);
      return false;
    }
  }

  function getDeterministicUserId(userInfo) {
    // Simple deterministic id based on user info fields
    const raw = `${userInfo.name}|${userInfo.gender}|${userInfo.dob}|${userInfo.topicValue}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
    }
    return `u-${hash.toString(16)}`;
  }

  async function loadFortuneHistory() {
    let serverFortunes = [];
    try {
      const response = await fetch(`${API_BASE}/fortune`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        const fortunes = data.fortunes || [];
        serverFortunes = fortunes.map((fortune) => ({
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
    } catch (error) {
      /* offline */
    }

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

    // Load saved chat history from localStorage first
    loadChatHistoryFromLocal();

    // Reconcile: replace server-sourced items with current server list (handles deletes),
    // keep local pending items, and avoid duplicates
    const localOnly = allHistories.filter((h) => h.source === "local");
    const localOnlyFiltered = localOnly.filter(
      (l) => !serverFortunes.some((sf) => sf.id === l.id) && !pending.some((p) => p.id === l.id)
    );

    allHistories = [
      ...serverFortunes,
      ...pending,
      ...localOnlyFiltered,
    ].sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    displayHistoryList();
    saveChatHistoryToLocal();
  }

  function getTopicDisplayName(topicValue) {
    const topicMap = {
      overall: "ภาพรวม",
      career: "การงาน",
      finance: "การเงิน",
      love: "ความรัก",
      health: "สุขภาพ",
    };
    return topicMap[topicValue] || topicValue;
  }

  // --- 5. Send flow with offline fallback ---
  async function handleSendMessage() {
    if (!isUserInfoSubmitted || isReplying) return;
    const userMessage = elements.messageInput.value.trim();
    if (!userMessage) return;
    const userInfo = getUserInfoFromForm();

    displayMessage(userMessage, "sent");
    elements.messageInput.value = "";
    isReplying = true;
    elements.messageInput.disabled = true;
    elements.sendBtn.disabled = true;
    elements.messageInput.placeholder = PLACEHOLDERS.LOADING;

    // Show typing indicator
    showTypingIndicator();

    // Cloud chat flow: create or append
    let aiPrediction = "";
    try {
      if (!currentChatId) {
        const chat = await createChatOnServer(userMessage, userInfo);
        currentChatId = chat._id || chat.id;
        // last two messages are user then assistant
        const lastMsg = chat.messages[chat.messages.length - 1];
        aiPrediction = lastMsg && lastMsg.role === "assistant" ? lastMsg.content : "";
      } else {
        const chat = await appendMessageToChat(currentChatId, userMessage, userInfo);
        const lastMsg = chat.messages[chat.messages.length - 1];
        aiPrediction = lastMsg && lastMsg.role === "assistant" ? lastMsg.content : "";
      }
    } catch (e) {
      aiPrediction = `เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (${API_BASE}). ลองใหม่ภายหลัง`;
    }

    // Display message with typing animation
    await displayMessageWithTyping(aiPrediction, "received");

    isReplying = false;
    elements.messageInput.disabled = false;
    elements.sendBtn.disabled = false;
    elements.messageInput.placeholder = PLACEHOLDERS.ENABLED;
    elements.messageInput.focus();
    saveCurrentChat();
  }

  function createMessageActions(type, pEl) {
    if (type !== "sent") return null;
    const actions = document.createElement("div");
    actions.className = "message-actions";
    const editBtn = document.createElement("button");
    editBtn.innerHTML = "✏️ แก้ไข";
    const resendBtn = document.createElement("button");
    resendBtn.innerHTML = "🔄 ส่งใหม่";
    actions.appendChild(editBtn);
    actions.appendChild(resendBtn);
    editBtn.addEventListener("click", async () => {
      const original = pEl.textContent;
      const updated = prompt("แก้ไขข้อความของคุณ:", original);
      if (updated == null || updated.trim() === "" || updated === original)
        return;
      pEl.textContent = updated;
      pEl.parentElement.classList.add("edited");
      // Update pending local if current is local
      if (currentChatId && String(currentChatId).startsWith("local-")) {
        const item = findPendingById(currentChatId);
        if (item) {
          item.text = updated;
          setPendingFortunes([
            item,
            ...getPendingFortunes().filter((x) => x.id !== currentChatId),
          ]);
        }
      }
      saveCurrentChat();
    });
    resendBtn.addEventListener("click", async () => {
      const newText = pEl.textContent.trim();
      const userInfo = getUserInfoFromForm();

      // Show typing indicator
      showTypingIndicator();
      elements.messageInput.disabled = true;
      elements.sendBtn.disabled = true;

      if (!currentChatId || String(currentChatId).startsWith("local-")) {
        // Offline/local: regenerate via /chat and update local pending
        try {
          const data = await getAiReplyViaChat(newText, userInfo);
          const newPred = data.prediction || "";

          // Remove the old response and show new one with typing
          const lastReceived = Array.from(
            elements.chatContainer.querySelectorAll(".message.received")
          )
            .filter((msg) => !msg.classList.contains("typing"))
            .pop();
          if (lastReceived) {
            lastReceived.remove();
          }

          await displayMessageWithTyping(newPred, "received", false);

          if (currentChatId && String(currentChatId).startsWith("local-")) {
            const item = findPendingById(currentChatId);
            if (item) {
              item.text = newText;
              item.prediction = newPred;
              setPendingFortunes([
                item,
                ...getPendingFortunes().filter((x) => x.id !== currentChatId),
              ]);
            }
          }
          saveCurrentChat();
        } catch (_) {
          removeTypingIndicator();
          alert("อัปเดตไม่สำเร็จ กรุณาลองใหม่");
        }
      } else {
        // Online id: PUT to update
        const newPrediction = await updateFortuneOnDB(
          currentChatId,
          userInfo,
          newText
        );
        if (newPrediction) {
          // Remove the old response and show new one with typing
          const lastReceived = Array.from(
            elements.chatContainer.querySelectorAll(".message.received")
          )
            .filter((msg) => !msg.classList.contains("typing"))
            .pop();
          if (lastReceived) {
            lastReceived.remove();
          }

          await displayMessageWithTyping(newPrediction, "received", false);
          saveCurrentChat();
        } else {
          // Fallback to local regenerate via /chat when DB is unavailable
          try {
            const data = await getAiReplyViaChat(newText, userInfo);
            const newPred = data.prediction || "";

            // Remove the old response and show new one with typing
            const lastReceived = Array.from(
              elements.chatContainer.querySelectorAll(".message.received")
            )
              .filter((msg) => !msg.classList.contains("typing"))
              .pop();
            if (lastReceived) {
              lastReceived.remove();
            }

            await displayMessageWithTyping(newPred, "received", false);
            saveCurrentChat();
          } catch (_) {
            removeTypingIndicator();
            alert("อัปเดตไม่สำเร็จ กรุณาลองใหม่");
          }
        }
      }

      elements.messageInput.disabled = false;
      elements.sendBtn.disabled = false;
    });
    return actions;
  }

  function displayMessage(text, type, shouldSave = true) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", type);
    const p = document.createElement("p");
    p.textContent = text;
    messageDiv.appendChild(p);
    const actions = createMessageActions(type, p);
    if (actions) messageDiv.appendChild(actions);
    elements.chatContainer.appendChild(messageDiv);
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
    if (shouldSave && currentChatId) saveCurrentChat();
    return messageDiv;
  }

  function showTypingIndicator() {
    // Remove any existing typing indicator first
    removeTypingIndicator();

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", "received", "typing");
    messageDiv.id = "typing-indicator";

    const p = document.createElement("p");
    p.classList.add("typing-text");

    // Random typing messages for variety
    const typingMessages = [
      "อาจารย์คมกำลังเพ่งดวง",
      "กำลังอ่านดวงชะตา",
      "กำลังดูดาวเคราะห์",
      "กำลังวิเคราะห์ดวง",
    ];
    const randomMessage =
      typingMessages[Math.floor(Math.random() * typingMessages.length)];
    p.innerHTML = `${randomMessage}<span class="typing-dots"></span>`;

    messageDiv.appendChild(p);
    elements.chatContainer.appendChild(messageDiv);
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;

    return messageDiv;
  }

  function removeTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  function typeWriterEffect(element, text, baseSpeed = 30) {
    return new Promise((resolve) => {
      element.textContent = "";
      let i = 0;

      const typeChar = () => {
        if (i < text.length) {
          const char = text.charAt(i);
          element.textContent += char;
          i++;

          // Variable speed for more natural typing
          let speed = baseSpeed;
          if (char === " ") speed = baseSpeed * 0.5; // Faster for spaces
          else if (char === "." || char === "!" || char === "?")
            speed = baseSpeed * 3; // Pause at sentence endings
          else if (char === ",")
            speed = baseSpeed * 1.5; // Small pause at commas
          else if (Math.random() < 0.1) speed = baseSpeed * 2; // Random pauses for realism

          setTimeout(typeChar, speed);
          // Auto-scroll as text appears
          elements.chatContainer.scrollTop =
            elements.chatContainer.scrollHeight;
        } else {
          resolve();
        }
      };

      typeChar();
    });
  }

  async function displayMessageWithTyping(text, type, shouldSave = true) {
    if (type === "received") {
      // Remove typing indicator
      removeTypingIndicator();

      // Small delay to simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create message bubble
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message", type);
      const p = document.createElement("p");
      messageDiv.appendChild(p);

      elements.chatContainer.appendChild(messageDiv);
      elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;

      // Type the text with animation
      await typeWriterEffect(p, text, 25); // 25ms base speed

      // Add actions after typing is complete
      const actions = createMessageActions(type, p);
      if (actions) messageDiv.appendChild(actions);

      if (shouldSave && currentChatId) saveCurrentChat();
      return messageDiv;
    } else {
      // For sent messages, display immediately
      return displayMessage(text, type, shouldSave);
    }
  }

  function saveCurrentChat() {
    if (!isUserInfoSubmitted) return;
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
    const existingIndex = allHistories.findIndex((h) => h.id === currentChatId);
    let chatSessionData;
    if (existingIndex > -1) {
      chatSessionData = {
        ...allHistories[existingIndex],
        lastMessageTime: new Date().toLocaleString("th-TH"),
        messages,
        userInfo: getUserInfoFromForm(),
      };
      allHistories.splice(existingIndex, 1);
    } else {
      const topicText =
        elements.topicSelect.options[elements.topicSelect.selectedIndex].text;
      chatSessionData = {
        id: currentChatId,
        topic: topicText,
        lastMessageTime: new Date().toLocaleString("th-TH"),
        messages,
        userInfo: getUserInfoFromForm(),
        source: String(currentChatId).startsWith("local-") ? "local" : "server",
      };
    }
    allHistories.unshift(chatSessionData);
    displayHistoryList();
    saveChatHistoryToLocal();
  }

  function saveChatHistoryToLocal() {
    try {
      localStorage.setItem(LS_KEYS.CHAT_HISTORY, JSON.stringify(allHistories));
      if (currentChatId) {
        localStorage.setItem(LS_KEYS.CURRENT_CHAT, currentChatId);
      }
    } catch (e) {
      console.warn("Failed to save chat history to localStorage:", e);
    }
  }

  function loadChatHistoryFromLocal() {
    try {
      const savedHistory = localStorage.getItem(LS_KEYS.CHAT_HISTORY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // Filter out any invalid entries
        allHistories = parsedHistory.filter(
          (chat) =>
            chat && chat.id && chat.messages && Array.isArray(chat.messages)
        );
        displayHistoryList();
      }
    } catch (e) {
      console.warn("Failed to load chat history from localStorage:", e);
      allHistories = [];
    }
  }

  function displayHistoryList() {
    elements.historyList.innerHTML = "";
    allHistories.forEach((chat) => {
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

  async function handleDeleteChat(chatId) {
    const confirmDelete = confirm(
      "คุณแน่ใจหรือไม่ที่จะลบแชทนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
    );
    if (!confirmDelete) return;
    if (String(chatId).startsWith("local-")) {
      removePendingFortuneById(chatId);
      allHistories = allHistories.filter((chat) => chat.id !== chatId);
      displayHistoryList();
      saveChatHistoryToLocal();
      if (currentChatId === chatId) resetApplication();
      alert("ลบแชทในเครื่องเรียบร้อยแล้ว");
      return;
    }
    const success = await deleteFortuneFromDB(chatId);
    if (success) {
      allHistories = allHistories.filter((chat) => chat.id !== chatId);
      displayHistoryList();
      saveChatHistoryToLocal();
      if (currentChatId === chatId) resetApplication();
      alert("ลบแชทเรียบร้อยแล้ว");
    } else {
      // Mongo unavailable: perform local-only delete so UX continues offline
      allHistories = allHistories.filter((chat) => chat.id !== chatId);
      displayHistoryList();
      saveChatHistoryToLocal();
      if (currentChatId === chatId) resetApplication();
      alert("ลบเฉพาะในเครื่องแล้ว (ฐานข้อมูลไม่พร้อม)");
    }
  }

  function loadSpecificChat(chatId) {
    const chatToLoad = allHistories.find((h) => h.id == chatId);
    if (!chatToLoad) return;
    elements.headerTitle.textContent = chatToLoad.topic;
    elements.chatContainer.innerHTML = "";
    chatToLoad.messages.forEach((msg) => {
      displayMessage(msg.text, msg.type, false);
    });
    if (chatToLoad.userInfo) {
      elements.userNameInput.value = chatToLoad.userInfo.name;
      elements.userGenderSelect.value = chatToLoad.userInfo.gender;
      elements.userDobInput.value = chatToLoad.userInfo.dob;
      elements.topicSelect.value = chatToLoad.userInfo.topicValue;
    }
    currentChatId = chatId;
    isUserInfoSubmitted = true;
    setChatState(true);
    elements.messageInput.focus();
    saveUserInfoToLocal();
  }

  function resetApplication() {
    isUserInfoSubmitted = false;
    currentChatId = null;
    elements.messageInput.value = "";
    elements.chatContainer.innerHTML = "";
    elements.headerTitle.textContent = "ดูดวง";
    setChatState(false);
    loadUserInfoFromLocal();
    loadFortuneHistory();
    // Clear current chat from localStorage
    try {
      localStorage.removeItem(LS_KEYS.CURRENT_CHAT);
    } catch (e) {}
  }

  function setChatState(enabled) {
    elements.messageInput.disabled = !enabled;
    elements.sendBtn.disabled = !enabled;
    if (enabled) {
      elements.messageInput.placeholder = PLACEHOLDERS.ENABLED;
      elements.chatContainer.classList.remove("disabled-chat");
    } else {
      elements.messageInput.placeholder = PLACEHOLDERS.DISABLED;
      elements.chatContainer.classList.add("disabled-chat");
    }
  }

  function handleSidebarSubmit() {
    const isNameValid = elements.userNameInput.value.trim() !== "";
    const isGenderValid = elements.userGenderSelect.value !== "";
    const isDobValid = elements.userDobInput.value.trim() !== "";
    const isTopicValid = elements.topicSelect.value !== "";
    if (isNameValid && isGenderValid && isDobValid && isTopicValid) {
      isUserInfoSubmitted = true;
      setChatState(true);
      elements.messageInput.focus();
      const selectedTopicText =
        elements.topicSelect.options[elements.topicSelect.selectedIndex].text;
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
    if (value.length > 4)
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    else if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    elements.userDobInput.value = value;
  }

  // Live update header and current history when inputs change
  elements.topicSelect.addEventListener("change", () => {
    elements.headerTitle.textContent =
      elements.topicSelect.options[elements.topicSelect.selectedIndex].text;
    saveCurrentChat();
    saveUserInfoToLocal();
  });
  elements.userNameInput.addEventListener("input", () => {
    saveCurrentChat();
    saveUserInfoToLocal();
  });
  elements.userGenderSelect.addEventListener("change", () => {
    saveCurrentChat();
    saveUserInfoToLocal();
  });
  elements.userDobInput.addEventListener("input", () => {
    saveCurrentChat();
    saveUserInfoToLocal();
  });

  // --- 6. Background sync ---
  async function trySyncPendingOnce() {
    // Check health first
    try {
      const health = await fetch(`${API_BASE}/health`).then((r) => r.json());
      if (!health || health.status !== "OK") return; // DB not ready
    } catch (_) {
      return;
    }

    const pending = getPendingFortunes();
    const remaining = [];
    for (const item of pending) {
      try {
        const res = await fetch(`${API_BASE}/fortune`, {
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
        // Replace local history id with server id if currently selected
        if (currentChatId === item.id) currentChatId = data.id;
      } catch (e) {
        remaining.push(item); // keep it for next round
      }
    }
    setPendingFortunes(remaining);
    // Always refresh from server to reflect remote changes (including deletions)
    await loadFortuneHistory();
    // Also refresh chat list for cross-device continuity
    await loadChatHistoryFromServer();
  }

  async function loadChatHistoryFromServer() {
    const info = getUserInfoFromForm();
    const userId = getDeterministicUserId(info);
    try {
      const res = await fetch(`${API_BASE}/chat/user/${encodeURIComponent(userId)}`);
      if (!res.ok) return;
      const chats = await res.json();
      const serverChats = (chats || []).map((c) => ({
        id: c._id || c.id,
        topic: getTopicDisplayName(info.topicValue),
        lastMessageTime: new Date(c.updatedAt || c.createdAt).toLocaleString("th-TH"),
        messages: (c.messages || []).map((m) => ({
          text: m.content,
          type: m.role === 'user' ? 'sent' : 'received'
        })),
        userInfo: info,
        source: 'server'
      }));

      // Keep any local pending that don't collide
      const localPending = getPendingFortunes().map((p) => ({
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

      const localOnly = (allHistories || []).filter((h) => h.source === 'local');
      const localOnlyFiltered = localOnly.filter(
        (l) => !serverChats.some((sc) => sc.id === l.id) && !localPending.some((p) => p.id === l.id)
      );

      allHistories = [
        ...serverChats,
        ...localPending,
        ...localOnlyFiltered
      ].sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

      displayHistoryList();
      saveChatHistoryToLocal();
    } catch (_) {
      // ignore
    }
  }
  function startBackgroundSync() {
    if (syncIntervalId) return;
    syncIntervalId = setInterval(trySyncPendingOnce, 10000);
  }

  // --- 7. Bind events ---
  elements.submitSidebarBtn.addEventListener("click", handleSidebarSubmit);
  elements.newChatBtn.addEventListener("click", resetApplication);
  elements.chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSendMessage();
  });
  elements.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Auto-resize textarea
  elements.messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 200) + "px";
  });
  if (elements.userDobInput)
    elements.userDobInput.addEventListener("input", formatDobInput);

  // --- 8. Initial Page Load ---
  detectApiBase().then(() => {
    loadUserInfoFromLocal();
    loadFortuneHistory();
    loadChatHistoryFromServer();

    // Check if we should restore a specific chat after loading history
    setTimeout(() => {
      const savedCurrentChat = localStorage.getItem(LS_KEYS.CURRENT_CHAT);
      if (
        savedCurrentChat &&
        allHistories.find((h) => h.id === savedCurrentChat)
      ) {
        loadSpecificChat(savedCurrentChat);
      }
    }, 100); // Small delay to ensure history is loaded

    startBackgroundSync();
  });
});
