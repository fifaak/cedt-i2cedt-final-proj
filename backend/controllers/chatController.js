const https = require('https');
const { Chat } = require('../services/mongoSync');

function makeHttpsRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Thai-Fortune-API/1.0',
        ...options.headers
      },
      timeout: 30000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });
    req.on('error', (error) => reject(new Error(`Request failed: ${error.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (options.body) { req.write(options.body); }
    req.end();
  });
}

async function getAiPrediction(userInfo, userMessage) {
  const API_KEY = process.env.TYPHOON_API_KEY;
  const API_ENDPOINT = 'https://api.opentyphoon.ai/v1/chat/completions';
  if (!API_KEY) {
    return 'ไม่พบ API Key สำหรับการเชื่อมต่อ AI กรุณาตรวจสอบการตั้งค่า';
  }
  const systemPrompt = `คุณคือ "อาจารย์คม" หมอดูสายตรงที่อ่านดวงตามความเป็นจริงโดยใช้หลักโหราศาสตร์ และ ดวงชะตา สไตล์การพูดของคุณคือ ตรงไปตรงมา, ขวานผ่าซาก เพื่อกระตุ้นให้คนฟังตื่นจากกันแล้วยอมรับความจริง เป้าหมายของคุณคือการใช้ข้อมูล วันเกิด และคำถามของผู้ใช้ เพื่อชี้ให้เห็น "ความจริง", จุดอ่อนที่พวกเขาอาจมองข้าม, และทางออกที่ต้องลงมือทำจริง ไม่ใช่แค่การให้กำลังใจลอยๆ จงตอบคำถามแบบกระชับ, เน้นความเป็นจริงที่เกิดขึ้นได้ และไม่ต้องกลัวที่จะพูดถึงผลลัพธ์ในแง่ลบถ้าดวงชะตามันชี้ไปทางนั้น โดยตอบแบบสั้นๆ ซัก 4-5 ประโยค แต่ได้ใจความ\n---\nข้อมูลผู้ใช้:\n- ชื่อ: ${userInfo.name}\n- วันเกิด: ${userInfo.birthdate}\n- เพศ: ${userInfo.sex}\n- หัวข้อที่กังวล: ${userInfo.topic}\n---`;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];
  try {
    const response = await makeHttpsRequest(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'typhoon-v2.1-12b-instruct',
        messages,
        temperature: 0.7,
        max_tokens: 256,
        top_p: 0.8,
        repetition_penalty: 1.1,
        stream: false,
      }),
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    return 'เซิร์ฟเวอร์พลังงานจักรวาลล่ม ติดต่อไม่ได้ ลองใหม่อีกที';
  }
}

// Create a new chat session (cloud-only) and append assistant reply
exports.createChat = async (req, res) => {
  try {
    const { userId, message, userInfo } = req.body;

    if (!userId || !message || !userInfo) {
      return res.status(400).json({ error: 'userId, message, and userInfo are required' });
    }

    const chat = new Chat({
      userId,
      messages: [{
        content: message,
        role: 'user',
        timestamp: new Date().toISOString(),
        edited: false,
        editHistory: []
      }]
    });

    let saved = await chat.save();

    const aiReply = await getAiPrediction(userInfo, message);
    saved.messages.push({
      content: aiReply,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      edited: false,
      editHistory: []
    });
    saved.updatedAt = new Date();
    saved = await saved.save();

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Error creating chat session' });
  }
};

// Get all chats for a user
exports.getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chats' });
  }
};

// Get a specific chat by ID
exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chat' });
  }
};

// Add a message to an existing chat; if it's a user message, also append AI reply
exports.addMessage = async (req, res) => {
  try {
    const { content, role, userInfo } = req.body;
    if (!content || !role) {
      return res.status(400).json({ error: 'content and role are required' });
    }

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.messages.push({
      content,
      role,
      timestamp: new Date().toISOString(),
      edited: false,
      editHistory: []
    });

    // If user message, get AI reply and append
    if (role === 'user') {
      const aiReply = await getAiPrediction(userInfo || {}, content);
      chat.messages.push({
        content: aiReply,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        edited: false,
        editHistory: []
      });
    }

    chat.updatedAt = new Date();
    const updatedChat = await chat.save();
    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ error: 'Error adding message' });
  }
};

// Edit a specific message in a chat
exports.editMessage = async (req, res) => {
  try {
    const { chatId, messageIndex } = req.params;
    const { content } = req.body;

    const index = Number(messageIndex);
    if (!Number.isInteger(index)) {
      return res.status(400).json({ error: 'Invalid message index' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (index < 0 || index >= chat.messages.length) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const currentMessage = chat.messages[index];
    currentMessage.editHistory = currentMessage.editHistory || [];
    currentMessage.editHistory.push({
      content: currentMessage.content,
      timestamp: new Date().toISOString()
    });
    currentMessage.content = content;
    currentMessage.edited = true;
    currentMessage.timestamp = new Date().toISOString();
    chat.updatedAt = new Date();

    const updatedChat = await chat.save();
    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ error: 'Error editing message' });
  }
};

// Delete a chat
exports.deleteChat = async (req, res) => {
  try {
    const deleted = await Chat.findByIdAndDelete(req.params.chatId);
    if (!deleted) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting chat' });
  }
};

// Delete a specific message from a chat
exports.deleteMessage = async (req, res) => {
  try {
    const { chatId, messageIndex } = req.params;

    const index = Number(messageIndex);
    if (!Number.isInteger(index)) {
      return res.status(400).json({ error: 'Invalid message index' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (index < 0 || index >= chat.messages.length) {
      return res.status(404).json({ error: 'Message not found' });
    }

    chat.messages.splice(index, 1);
    chat.updatedAt = new Date();
    const updatedChat = await chat.save();
    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ error: 'Error deleting message' });
  }
};
