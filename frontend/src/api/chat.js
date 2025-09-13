const API_BASE_URL = 'http://localhost:5000/chat';

// Create a new chat session
export const createChat = async (userId, message) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, message }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// Get all chats for a user
export const getUserChats = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching user chats:', error);
    throw error;
  }
};

// Get a specific chat by ID
export const getChatById = async (chatId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${chatId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error;
  }
};

// Add a message to a chat
export const addMessage = async (chatId, content, role) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, role }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
};

// Edit a message in a chat
export const editMessage = async (chatId, messageIndex, content) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${chatId}/messages/${messageIndex}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

// Delete a chat
export const deleteChat = async (chatId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${chatId}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

// Delete a message from a chat
export const deleteMessage = async (chatId, messageIndex) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${chatId}/messages/${messageIndex}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};
