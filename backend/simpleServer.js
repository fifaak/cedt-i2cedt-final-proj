import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// In-memory conversation store: an array of { role: 'user'|'assistant', content: string }
// NOTE: For production, persist this per user/session in a database instead.
const messages = [];

// Optional: a fixed system prompt for persona/behavior
const SYSTEM_PROMPT = 'You are a helpful assistant. Answer only in Thai.';

const TYPHOON_API_URL = 'https://api.opentyphoon.ai/v1/chat/completions';
const TYPHOON_MODEL = process.env.TYPHOON_MODEL || 'typhoon-v2.1-12b-instruct';

async function callTyphoon(currentMessages) {
	const apiKey = process.env.TYPHOON_API_KEY;
	if (!apiKey) {
		throw new Error('Missing TYPHOON_API_KEY in environment');
	}

	// Compose messages: prepend system prompt, then the conversation
	const payload = {
		model: TYPHOON_MODEL,
		messages: [
			{ role: 'system', content: SYSTEM_PROMPT },
			...currentMessages,
		],
		max_tokens: 512,
		temperature: 0.6,
		top_p: 0.95,
		repetition_penalty: 1.05,
		stream: false,
	};

	const resp = await fetch(TYPHOON_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify(payload),
	});
	if (!resp.ok) {
		const text = await resp.text();
		throw new Error(`Typhoon API error ${resp.status}: ${text}`);
	}
	const data = await resp.json();
	const content = data?.choices?.[0]?.message?.content ?? '';
	return content;
}

// GET /messages - return the full conversation (in order)
app.get('/messages', (req, res) => {
	return res.json({ messages });
});

// POST /message - add a new user message, call LLM, store assistant reply
// Body: { content: string }
app.post('/message', async (req, res) => {
	try {
		const { content } = req.body || {};
		if (!content || typeof content !== 'string') {
			return res.status(400).json({ error: 'content is required (string)' });
		}

		messages.push({ role: 'user', content });
		const assistant = await callTyphoon(messages);
		messages.push({ role: 'assistant', content: assistant });

		return res.status(201).json({ messages });
	} catch (err) {
		return res.status(500).json({ error: 'Failed to process message', details: err.message });
	}
});

// PUT /message/:index - edit a user message at a given index, truncate following messages, regenerate assistant
// Path param :index refers to index in the messages array.
// Only user messages can be edited. After editing, all messages after that index are removed.
// Body: { content: string }
app.put('/message/:index', async (req, res) => {
	try {
		const index = Number(req.params.index);
		if (!Number.isInteger(index) || index < 0 || index >= messages.length) {
			return res.status(400).json({ error: 'index out of range' });
		}
		if (messages[index].role !== 'user') {
			return res.status(400).json({ error: 'Only user messages can be edited' });
		}
		const { content } = req.body || {};
		if (!content || typeof content !== 'string') {
			return res.status(400).json({ error: 'content is required (string)' });
		}

		// Replace the content at index and truncate everything after
		messages[index].content = content;
		messages.splice(index + 1); // remove all messages after the edited one

		// Generate a new assistant response for the updated conversation
		const assistant = await callTyphoon(messages);
		messages.push({ role: 'assistant', content: assistant });

		return res.json({ messages });
	} catch (err) {
		return res.status(500).json({ error: 'Failed to edit message', details: err.message });
	}
});

// Simple health endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.SIMPLE_PORT || 4001;
app.listen(PORT, () => {
	console.log(`Simple chat server listening on port ${PORT}`);
});


