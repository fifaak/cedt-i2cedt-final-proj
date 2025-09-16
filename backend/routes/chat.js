import { Router } from 'express';
import { createMessage, getHistory, editMessage } from '../controllers/chatController.js';

const router = Router();

// Create a new chat message (send to Typhoon, save to MongoDB)
router.post('/', createMessage);

// Retrieve chat history by user (name & birthdate query)
router.get('/history', getHistory);

// Edit a previous user message (and resend to Typhoon)
router.put('/:id', editMessage);

export default router;


