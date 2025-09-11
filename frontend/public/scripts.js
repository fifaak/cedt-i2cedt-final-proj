document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        chatForm: document.getElementById('chat-form'),
        messageInput: document.getElementById('message-input'),
        chatContainer: document.getElementById('chat-container'),
        sendBtn: document.getElementById('send-btn'),
        submitSidebarBtn: document.getElementById('submit-sidebar-btn'),
        userNameInput: document.getElementById('user-name'),
        userGenderSelect: document.getElementById('user-gender'),
        userDobInput: document.getElementById('user-dob'),
        topicSelect: document.getElementById('horoscope-topic'),
        newChatBtn: document.getElementById('new-chat-btn'),
        historyList: document.getElementById('history-list'),
        headerTitle: document.querySelector('header h1'),
    };

    const PLACEHOLDERS = {
        DISABLED: 'กรอกข้อมูลด้านซ้ายแล้วกดส่ง',
        ENABLED: 'พิมพ์คำถามที่นี่...',
        LOADING: 'อาจารย์คมกำลังเพ่งดวง...',
    };

    const API_BASE = 'http://localhost:3001/api';
    let isReplying = false;
    let isUserInfoSubmitted = false;
    let currentChatId = null;
    let allHistories = [];
    let isBackendConnected = false;

    // Check backend connection
    async function checkBackendConnection() {
        try {
            const response = await fetch(`${API_BASE}/health`);
            if (response.ok) {
                isBackendConnected = true;
                console.log('✅ Backend connected');
                return true;
            }
        } catch (error) {
            console.error('❌ Backend connection failed:', error);
        }
        isBackendConnected = false;
        return false;
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
            ${type === 'success' ? 
                'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
                type === 'error' ?
                'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' :
                'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;'
            }
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => notification.remove(), 3000);
    }

    // Show connection status
    function showConnectionStatus() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            ${isBackendConnected ? 
                'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
                'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
            }
        `;
        statusDiv.textContent = isBackendConnected ? '🟢 เชื่อมต่อแล้ว' : '🔴 ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์';
        
        // Remove existing status
        const existing = document.getElementById('connection-status');
        if (existing) existing.remove();
        
        document.body.appendChild(statusDiv);
        
        // Auto hide after 3 seconds if connected
        if (isBackendConnected) {
            setTimeout(() => statusDiv.remove(), 3000);
        }
    }

    // Functions
    async function getAiReply(userMessage, userInfo, historyMessages = []) {
        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    userInfo: {
                        name: userInfo.name,
                        birthdate: userInfo.dob,
                        sex: userInfo.gender,
                        topic: userInfo.topicValue
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.prediction;

        } catch (error) {
            console.error("Error fetching AI reply:", error);
            isBackendConnected = false;
            showConnectionStatus();
            return "เซิร์ฟเวอร์พลังงานจักรวาลล่ม ติดต่อไม่ได้ ลองใหม่อีกที";
        }
    }

    // Save fortune reading to backend
    async function saveFortuneToDB(userInfo, userMessage, prediction) {
        try {
            const response = await fetch(`${API_BASE}/fortune`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: userInfo.name,
                    birthdate: userInfo.dob,
                    sex: userInfo.gender,
                    topic: userInfo.topicValue,
                    text: userMessage,
                    prediction: prediction
                })
            });

            if (!response.ok) {
                console.error('Failed to save to database');
            }

            const data = await response.json();
            return data.id;

        } catch (error) {
            console.error("Error saving to database:", error);
            return null;
        }
    }

    // Load fortune history from backend
    async function loadFortuneHistory() {
        try {
            const response = await fetch(`${API_BASE}/fortune`);
            
            if (!response.ok) {
                console.error('Failed to load history');
                return;
            }

            const data = await response.json();
            const fortunes = data.fortunes || data; // Handle both old and new format
            
            // Convert to local history format
            allHistories = fortunes.map(fortune => ({
                id: fortune.id,
                topic: getTopicDisplayName(fortune.topic),
                lastMessageTime: new Date(fortune.created_at).toLocaleString('th-TH'),
                messages: [
                    { text: fortune.text, type: 'sent' },
                    { text: fortune.prediction, type: 'received' }
                ],
                userInfo: {
                    name: fortune.name,
                    gender: fortune.sex,
                    dob: fortune.birthdate,
                    topicValue: fortune.topic
                }
            }));

            displayHistoryList();

        } catch (error) {
            console.error("Error loading history:", error);
            isBackendConnected = false;
            showConnectionStatus();
        }
    }

    function getTopicDisplayName(topicValue) {
        const topicMap = {
            'overall': 'ภาพรวม',
            'career': 'การงาน',
            'finance': 'การเงิน',
            'love': 'ความรัก',
            'health': 'สุขภาพ'
        };
        return topicMap[topicValue] || topicValue;
    }

    async function handleSendMessage() {
        if (!isUserInfoSubmitted || isReplying) return;

        const userMessage = elements.messageInput.value.trim();
        if (userMessage) {
            displayMessage(userMessage, 'sent');
            elements.messageInput.value = '';

            isReplying = true;
            elements.messageInput.disabled = true;
            elements.sendBtn.disabled = true;
            elements.messageInput.placeholder = PLACEHOLDERS.LOADING;

            const currentChat = allHistories.find(h => h.id === currentChatId);
            const currentUserInfo = currentChat?.userInfo || {
                name: elements.userNameInput.value,
                gender: elements.userGenderSelect.value,
                dob: elements.userDobInput.value,
                topicValue: elements.topicSelect.value
            };

            const historyMessages = currentChat ? currentChat.messages : [];

            const aiReply = await getAiReply(userMessage, currentUserInfo, historyMessages);
            displayMessage(aiReply, 'received');

            // Save to database
            await saveFortuneToDB(currentUserInfo, userMessage, aiReply);

            isReplying = false;
            elements.messageInput.disabled = false;
            elements.sendBtn.disabled = false;
            elements.messageInput.placeholder = PLACEHOLDERS.ENABLED;
            elements.messageInput.focus();
        }
    }

    function displayMessage(text, type, shouldSave = true) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);
        elements.chatContainer.appendChild(messageDiv);
        elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
        
        if (shouldSave && currentChatId) {
            saveCurrentChat();
        }
    }

    function saveCurrentChat() {
        if (!isUserInfoSubmitted) return;
        
        const messages = [];
        elements.chatContainer.querySelectorAll('.message').forEach(bubble => {
            messages.push({
                text: bubble.querySelector('p').textContent,
                type: bubble.classList.contains('sent') ? 'sent' : 'received'
            });
        });

        if (messages.length === 0) return;

        const existingIndex = allHistories.findIndex(h => h.id === currentChatId);
        let chatSessionData;

        if (existingIndex > -1) {
            chatSessionData = {
                ...allHistories[existingIndex],
                lastMessageTime: new Date().toLocaleString('th-TH'),
                messages: messages
            };
            allHistories.splice(existingIndex, 1);
        } else {
            chatSessionData = {
                id: currentChatId,
                topic: elements.topicSelect.options[elements.topicSelect.selectedIndex].text,
                lastMessageTime: new Date().toLocaleString('th-TH'),
                messages: messages,
                userInfo: {
                    name: elements.userNameInput.value,
                    gender: elements.userGenderSelect.value,
                    dob: elements.userDobInput.value,
                    topicValue: elements.topicSelect.value
                }
            };
        }

        allHistories.unshift(chatSessionData);
        displayHistoryList();
    }

    function displayHistoryList() {
        elements.historyList.innerHTML = '';
        allHistories.forEach(chat => {
            const li = document.createElement('li');
            li.dataset.id = chat.id;
            li.innerHTML = `${chat.topic}<small>${chat.lastMessageTime}</small>`;
            li.addEventListener('click', () => loadSpecificChat(chat.id));
            elements.historyList.appendChild(li);
        });
    }

    function loadSpecificChat(chatId) {
        const chatToLoad = allHistories.find(h => h.id == chatId);
        if (chatToLoad) {
            elements.headerTitle.textContent = chatToLoad.topic;
            elements.chatContainer.innerHTML = '';
            chatToLoad.messages.forEach(msg => {
                displayMessage(msg.text, msg.type, false);
            });
            
            if (chatToLoad.userInfo) {
                elements.userNameInput.value = chatToLoad.userInfo.name;
                elements.userGenderSelect.value = chatToLoad.userInfo.gender;
                elements.userDobInput.value = chatToLoad.userInfo.dob;
                elements.topicSelect.value = chatToLoad.userInfo.topicValue;
            }
            
            // Keep inputs editable - don't lock them
            elements.submitSidebarBtn.textContent = 'อัปเดตข้อมูล';
            
            currentChatId = chatId;
            isUserInfoSubmitted = true;
            setChatState(true);
            elements.messageInput.focus();
        }
    }

    function resetApplication() {
        saveCurrentChat();
        isUserInfoSubmitted = false;
        currentChatId = null;
        
        elements.userNameInput.value = '';
        elements.userGenderSelect.value = '';
        elements.userDobInput.value = '';
        elements.topicSelect.value = 'overall';
        elements.submitSidebarBtn.textContent = 'เริ่มแชท';
        elements.headerTitle.textContent = 'ดูดวง';
        
        setChatState(false);
        elements.chatContainer.innerHTML = '';
        loadFortuneHistory(); // Reload from database
    }

    function setChatState(enabled) {
        elements.messageInput.disabled = !enabled;
        elements.sendBtn.disabled = !enabled;
        
        if (enabled) {
            elements.messageInput.placeholder = PLACEHOLDERS.ENABLED;
            elements.chatContainer.classList.remove('disabled-chat');
        } else {
            elements.messageInput.placeholder = PLACEHOLDERS.DISABLED;
            elements.chatContainer.classList.add('disabled-chat');
        }
    }

    async function handleSidebarSubmit() {
        const isNameValid = elements.userNameInput.value.trim() !== '';
        const isGenderValid = elements.userGenderSelect.value !== '';
        const isDobValid = elements.userDobInput.value.trim() !== '';
        const isTopicValid = elements.topicSelect.value !== '';
        
        if (isNameValid && isGenderValid && isDobValid && isTopicValid) {
            // If updating existing chat, update the user info
            if (currentChatId && allHistories.find(h => h.id === currentChatId)) {
                await updateUserInfo();
            } else {
                // New chat session
                currentChatId = Date.now();
            }
            
            isUserInfoSubmitted = true;
            setChatState(true);
            elements.messageInput.focus();
            
            const selectedTopicText = elements.topicSelect.options[elements.topicSelect.selectedIndex].text;
            elements.headerTitle.textContent = selectedTopicText;
            
            elements.submitSidebarBtn.textContent = 'อัปเดตข้อมูล';
            
            saveCurrentChat();
        } else {
            alert('กรอกข้อมูลให้ครบก่อน');
        }
    }

    async function updateUserInfo() {
        const currentChat = allHistories.find(h => h.id === currentChatId);
        if (currentChat) {
            // Update local history
            currentChat.userInfo = {
                name: elements.userNameInput.value,
                gender: elements.userGenderSelect.value,
                dob: elements.userDobInput.value,
                topicValue: elements.topicSelect.value
            };
            currentChat.topic = getTopicDisplayName(elements.topicSelect.value);
            
            // Update header
            elements.headerTitle.textContent = currentChat.topic;
            
            // Refresh history display
            displayHistoryList();
            
            console.log('✅ User info updated for current chat');
            
            // Show update confirmation
            showNotification('ข้อมูลผู้ใช้อัปเดตแล้ว', 'success');
        }
    }

    function formatDobInput() {
        let value = elements.userDobInput.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        
        if (value.length > 4) {
            value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
        } else if (value.length > 2) {
            value = `${value.slice(0, 2)}/${value.slice(2)}`;
        }
        
        elements.userDobInput.value = value;
        
        // Validate date format
        if (value.length === 10) {
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (dateRegex.test(value)) {
                elements.userDobInput.style.borderColor = '#28a745';
            } else {
                elements.userDobInput.style.borderColor = '#dc3545';
            }
        } else {
            elements.userDobInput.style.borderColor = '#ced4da';
        }
    }

    // --- 4. Event Listeners ---
    elements.submitSidebarBtn.addEventListener('click', handleSidebarSubmit);
    elements.newChatBtn.addEventListener('click', resetApplication);
    elements.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSendMessage();
    });
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    if (elements.userDobInput) {
        elements.userDobInput.addEventListener('input', formatDobInput);
    }

    // Initialize application
    async function initializeApp() {
        await checkBackendConnection();
        showConnectionStatus();
        resetApplication();
    }

    // --- 5. Initial Page Load ---
    initializeApp();
});