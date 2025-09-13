const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Create a new chat session
router.post('/', chatController.createChat);

// Get all chats for a user
router.get('/user/:userId', chatController.getUserChats);

// Get a specific chat
router.get('/:chatId', chatController.getChatById);

// Add a message to a chat
router.post('/:chatId/messages', chatController.addMessage);

// Edit a specific message
router.put('/:chatId/messages/:messageIndex', chatController.editMessage);

// Delete a chat
router.delete('/:chatId', chatController.deleteChat);

// Delete a specific message
router.delete('/:chatId/messages/:messageIndex', chatController.deleteMessage);

module.exports = router;
