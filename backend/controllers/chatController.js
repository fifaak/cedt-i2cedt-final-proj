import ChatMessage from '../models/ChatMessage.js';
import { getTyphoonCompletion } from '../services/typhoonClient.js';
import { DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT } from '../utils/constants.js';
import { validateUserInfo } from '../utils/validators.js';

function buildSystemPrompt(userInfo) {
	return `คุณคือ "อาจารย์คม" หมอดูสายตรงที่อ่านดวงตามความเป็นจริงโดยใช้หลักโหราศาสตร์ และ ดวงชะตา สไตล์การพูดของคุณคือ ตรงไปตรงมา, ขวานผ่าซาก เพื่อกระตุ้นให้คนฟังตื่นจากกันแล้วยอมรับความจริง เป้าหมายของคุณคือการใช้ข้อมูล วันเกิด และคำถามของผู้ใช้ เพื่อชี้ให้เห็น "ความจริง", จุดอ่อนที่พวกเขาอาจมองข้าม, และทางออกที่ต้องลงมือทำจริง ไม่ใช่แค่การให้กำลังใจลอยๆ จงตอบคำถามแบบกระชับ, เน้นความเป็นจริงที่เกิดขึ้นได้ และไม่ต้องกลัวที่จะพูดถึงผลลัพธ์ในแง่ลบถ้าดวงชะตามันชี้ไปทางนั้น โดยตอบแบบสั้นๆ ซัก 4-5 ประโยค แต่ได้ใจความ
---
User Information:
- Name: ${userInfo.name}
- Birthdate: ${userInfo.birthdate}
- Sex: ${userInfo.sex}
- Concern Topic: ${userInfo.topic}
---`;
}

export const createMessage = async (req, res) => {
	try {
		const { userInfo, message } = req.body;
		const error = validateUserInfo(userInfo);
		if (error) return res.status(400).json({ error });
		if (!message || typeof message !== 'string') {
			return res.status(400).json({ error: 'Missing message' });
		}

		const systemPrompt = buildSystemPrompt(userInfo);

		// Pull prior messages for this user (only user messages) to build context
		const history = await ChatMessage.find({
			'userInfo.name': userInfo.name,
			'userInfo.birthdate': userInfo.birthdate,
		})
			.sort({ createdAt: 1 })
			.select('userMessage');
		const priorUserMessages = history.map((h) => ({ role: 'user', content: h.userMessage }));
		const messages = [...priorUserMessages, { role: 'user', content: message }];

		const { content } = await getTyphoonCompletion(systemPrompt, messages);

		const saved = await ChatMessage.create({
			userInfo,
			systemPrompt,
			userMessage: message,
			assistantResponse: content,
		});

		return res.status(201).json(saved);
	} catch (err) {
		return res.status(500).json({ error: 'Failed to create message', details: err.message });
	}
};

export const getHistory = async (req, res) => {
	try {
		const { name, birthdate } = req.query;
		if (!name || !birthdate) {
			return res.status(400).json({ error: 'Missing name or birthdate in query' });
		}
		let { limit = DEFAULT_HISTORY_LIMIT } = req.query;
		limit = Math.min(Number(limit) || DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT);
		const items = await ChatMessage.find({ 'userInfo.name': name, 'userInfo.birthdate': birthdate })
			.sort({ createdAt: 1 })
			.limit(limit);
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ error: 'Failed to fetch history', details: err.message });
	}
};

export const editMessage = async (req, res) => {
	try {
		const { id } = req.params;
		const { newMessage } = req.body;
		if (!newMessage || typeof newMessage !== 'string') {
			return res.status(400).json({ error: 'Missing newMessage' });
		}
		const existing = await ChatMessage.findById(id);
		if (!existing) return res.status(404).json({ error: 'Message not found' });

		const systemPrompt = buildSystemPrompt(existing.userInfo);

		// Build context from all prior messages EXCEPT the one being edited
		const history = await ChatMessage.find({
			'userInfo.name': existing.userInfo.name,
			'userInfo.birthdate': existing.userInfo.birthdate,
			_id: { $ne: existing._id },
		})
			.sort({ createdAt: 1 })
			.select('userMessage');
		const priorUserMessages = history.map((h) => ({ role: 'user', content: h.userMessage }));
		const messages = [...priorUserMessages, { role: 'user', content: newMessage }];

		const { content } = await getTyphoonCompletion(systemPrompt, messages);

		existing.userMessage = newMessage;
		existing.systemPrompt = systemPrompt;
		existing.assistantResponse = content;
		await existing.save();

		return res.json(existing);
	} catch (err) {
		return res.status(500).json({ error: 'Failed to edit message', details: err.message });
	}
};


