document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Constants ---
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
        hamburger: document.querySelector('.hamburger')
    };
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.overlay');

    // Improved mobile sidebar handling
    const toggleMenu = () => {
        const isOpen = sidebar.classList.contains('active');
        elements.hamburger.classList.toggle('is-active');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = !isOpen ? 'hidden' : '';

        // Accessibility
        elements.hamburger.setAttribute('aria-expanded', !isOpen);
        sidebar.setAttribute('aria-hidden', isOpen);
    };

    if (elements.hamburger) {
        elements.hamburger.addEventListener('click', toggleMenu);
        elements.hamburger.setAttribute('aria-expanded', 'false');
        sidebar.setAttribute('aria-hidden', 'true');

        // Close sidebar when clicking overlay
        overlay.addEventListener('click', toggleMenu);

        // Handle touch events for sidebar
        let touchStartX = 0;
        let touchEndX = 0;
        let isSwiping = false;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            isSwiping = true;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            
            const currentX = e.changedTouches[0].screenX;
            const diff = currentX - touchStartX;
            
            // Only handle swipes from edge or when menu is open
            if (touchStartX < 30 || sidebar.classList.contains('active')) {
                const translateX = sidebar.classList.contains('active') ? 
                    Math.min(0, diff) : Math.max(-100, diff);
                sidebar.style.transform = `translateX(${translateX}%)`;
                
                // Adjust overlay opacity based on swipe
                const opacity = sidebar.classList.contains('active') ? 
                    Math.max(0, 1 - Math.abs(diff) / 200) :
                    Math.min(1, (diff + 100) / 200);
                overlay.style.opacity = opacity;
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            
            touchEndX = e.changedTouches[0].screenX;
            const swipeDistance = touchEndX - touchStartX;
            const SWIPE_THRESHOLD = 50;

            // Reset transitions
            sidebar.style.transform = '';
            overlay.style.opacity = '';
            
            if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
                if (swipeDistance > 0 && touchStartX < 30) {
                    toggleMenu(); // Open menu
                } else if (swipeDistance < 0 && sidebar.classList.contains('active')) {
                    toggleMenu(); // Close menu
                }
            } else {
                // Reset to previous state if swipe wasn't far enough
                sidebar.style.transform = sidebar.classList.contains('active') ? 
                    'translateX(100%)' : 'translateX(0)';
            }
            
            isSwiping = false;
        }, { passive: true });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                toggleMenu();
            }
        });

        // Close menu when resizing to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    // Handle mobile keyboard
    elements.messageInput.addEventListener('focus', () => {
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                window.scrollTo(0, document.body.scrollHeight);
                elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
            }, 300);
        }
    });

    const PLACEHOLDERS = {
        DISABLED: 'กรอกข้อมูลด้านซ้ายแล้วกดส่ง',
        ENABLED: 'พิมพ์คำถามที่นี่...',
        LOADING: 'อาจารย์คมกำลังเพ่งดวง...',
    };

    // API Base URL - adjust for your deployment
    const API_BASE = 'http://localhost:3001/api';

    // --- 2. State Variables ---
    let isReplying = false;
    let isUserInfoSubmitted = false;
    let currentChatId = null;
    let allHistories = [];

    // --- 3. Functions ---

    // Updated to use Express backend
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

    // Delete fortune reading from backend
    async function deleteFortuneFromDB(fortuneId) {
        try {
            const response = await fetch(`${API_BASE}/fortune/${fortuneId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                console.error('Failed to delete from database');
                return false;
            }

            return true;

        } catch (error) {
            console.error("Error deleting from database:", error);
            return false;
        }
    }

    // Load fortune history from backend
    async function loadFortuneHistory() {
        try {
            const response = await fetch(`${API_BASE}/fortune`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('Failed to load history:', response.status);
                return;
            }

            const data = await response.json();
            const fortunes = data.fortunes || []; // Handle the new API response structure
            
            // Convert to local history format
            allHistories = fortunes.map(fortune => ({
                id: fortune.id,
                topic: getTopicDisplayName(fortune.topic),
                lastMessageTime: new Date(fortune.created_at).toLocaleString('th-TH'),
                messages: [
                    { text: fortune.text || '', type: 'sent' },
                    { text: fortune.prediction || '', type: 'received' }
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
            console.log("Response:", error.response);
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

    // Updated displayHistoryList function with delete buttons
    function displayHistoryList() {
        elements.historyList.innerHTML = '';
        allHistories.forEach(chat => {
            const li = document.createElement('li');
            li.dataset.id = chat.id;
            
            // Create chat info container
            const chatInfo = document.createElement('div');
            chatInfo.className = 'chat-info';
            chatInfo.innerHTML = `${chat.topic}<small>${chat.lastMessageTime}</small>`;
            chatInfo.addEventListener('click', () => loadSpecificChat(chat.id));
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-chat-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'ลบแชทนี้';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering chat load
                handleDeleteChat(chat.id);
            });
            
            li.appendChild(chatInfo);
            li.appendChild(deleteBtn);
            elements.historyList.appendChild(li);
        });
    }

    // Handle chat deletion
    async function handleDeleteChat(chatId) {
        const confirmDelete = confirm('คุณแน่ใจหรือไม่ที่จะลบแชทนี้? การกระทำนี้ไม่สามารถย้อนกลับได้');
        
        if (!confirmDelete) return;

        try {
            // Delete from database
            const success = await deleteFortuneFromDB(chatId);
            
            if (success) {
                // Remove from local history
                allHistories = allHistories.filter(chat => chat.id !== chatId);
                displayHistoryList();
                
                // If currently viewing the deleted chat, reset to new chat
                if (currentChatId === chatId) {
                    resetApplication();
                }
                
                alert('ลบแชทเรียบร้อยแล้ว');
            } else {
                alert('เกิดข้อผิดพลาดในการลบแชท กรุณาลองใหม่อีกครั้ง');
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('เกิดข้อผิดพลาดในการลบแชท กรุณาลองใหม่อีกครั้ง');
        }
    }

    // Handle clear all chats
    async function handleClearAll() {
        const confirmClear = confirm('คุณแน่ใจหรือไม่ที่จะลบประวัติการแชททั้งหมด?\nการกระทำนี้จะลบข้อมูลทั้งหมดและไม่สามารถย้อนกลับได้');
        
        if (!confirmClear) return;

        try {
            // Clear all from database
            const success = await clearAllFortunesFromDB();
            
            if (success) {
                // Clear local history
                allHistories = [];
                displayHistoryList();
                
                // Reset to new chat
                resetApplication();
                
                alert('ลบประวัติการแชททั้งหมดเรียบร้อยแล้ว');
            } else {
                alert('เกิดข้อผิดพลาดในการลบประวัติ กรุณาลองใหม่อีกครั้ง');
            }
        } catch (error) {
            console.error('Error clearing all chats:', error);
            alert('เกิดข้อผิดพลาดในการลบประวัติ กรุณาลองใหม่อีกครั้ง');
        }
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
            
            const sidebarInputs = [elements.userNameInput, elements.userGenderSelect, elements.userDobInput, elements.topicSelect, elements.submitSidebarBtn];
            sidebarInputs.forEach(el => el.disabled = true);
            elements.submitSidebarBtn.textContent = 'ข้อมูลถูกล็อคแล้ว';
            
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
        
        const sidebarInputs = [elements.userNameInput, elements.userGenderSelect, elements.userDobInput, elements.topicSelect, elements.submitSidebarBtn];
        sidebarInputs.forEach(el => el.disabled = false);
        
        elements.userNameInput.value = '';
        elements.userGenderSelect.value = '';
        elements.userDobInput.value = '';
        elements.topicSelect.value = 'overall';
        elements.submitSidebarBtn.textContent = 'ส่ง';
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

    function handleSidebarSubmit() {
        const isNameValid = elements.userNameInput.value.trim() !== '';
        const isGenderValid = elements.userGenderSelect.value !== '';
        const isDobValid = elements.userDobInput.value.trim() !== '';
        const isTopicValid = elements.topicSelect.value !== '';
        
        if (isNameValid && isGenderValid && isDobValid && isTopicValid) {
            isUserInfoSubmitted = true;
            currentChatId = Date.now();
            setChatState(true);
            elements.messageInput.focus();
            
            const selectedTopicText = elements.topicSelect.options[elements.topicSelect.selectedIndex].text;
            elements.headerTitle.textContent = selectedTopicText;
            
            const sidebarInputs = [elements.userNameInput, elements.userGenderSelect, elements.userDobInput, elements.topicSelect, elements.submitSidebarBtn];
            sidebarInputs.forEach(el => el.disabled = true);
            elements.submitSidebarBtn.textContent = 'ข้อมูลถูกล็อคแล้ว';
            
            saveCurrentChat();
        } else {
            alert('กรอกข้อมูลให้ครบก่อน');
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

    // --- 5. Initial Page Load ---
    resetApplication();
});