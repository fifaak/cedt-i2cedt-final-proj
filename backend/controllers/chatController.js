const localStorage = require('../storage/localStorage');

// Create a new chat session
exports.createChat = async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    const newChat = await localStorage.createChat({
      userId,
      messages: [{
        content: message,
        role: 'user',
        timestamp: new Date().toISOString(),
        edited: false,
        editHistory: []
      }]
    });

    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ error: 'Error creating chat session' });
  }
};

// Get all chats for a user
exports.getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await localStorage.getChatsByUserId(userId);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chats' });
  }
};

// Get a specific chat by ID
exports.getChatById = async (req, res) => {
  try {
    const chat = await localStorage.getChatById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chat' });
  }
};

// Add a message to an existing chat
exports.addMessage = async (req, res) => {
  try {
    const { content, role } = req.body;
    const chat = await localStorage.getChatById(req.params.chatId);
    
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

    const updatedChat = await localStorage.updateChat(req.params.chatId, chat);
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
    
    const chat = await localStorage.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (messageIndex >= chat.messages.length) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Store the current message in edit history
    const currentMessage = chat.messages[messageIndex];
    if (!currentMessage.editHistory) {
      currentMessage.editHistory = [];
    }
    
    currentMessage.editHistory.push({
      content: currentMessage.content,
      timestamp: new Date().toISOString()
    });

    // Update the message
    currentMessage.content = content;
    currentMessage.edited = true;
    currentMessage.timestamp = new Date().toISOString();

    const updatedChat = await localStorage.updateChat(chatId, chat);
    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ error: 'Error editing message' });
  }
};

// Delete a chat
exports.deleteChat = async (req, res) => {
  try {
    const chat = await localStorage.deleteChat(req.params.chatId);
    if (!chat) {
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
    
    const chat = await localStorage.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (messageIndex >= chat.messages.length) {
      return res.status(404).json({ error: 'Message not found' });
    }

    chat.messages.splice(messageIndex, 1);
    const updatedChat = await localStorage.updateChat(chatId, chat);
    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ error: 'Error deleting message' });
  }
};
