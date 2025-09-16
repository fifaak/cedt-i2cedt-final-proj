import dotenv from 'dotenv';

dotenv.config();

const TYPHOON_API_URL = 'https://api.opentyphoon.ai/v1/chat/completions';
const TYPHOON_MODEL = process.env.TYPHOON_MODEL || 'typhoon-v2.1-12b-instruct';

export async function getTyphoonCompletion(systemPrompt, userMessage, options = {}) {
	const {
		max_tokens = 512,
		temperature = 0.6,
		top_p = 0.95,
		repetition_penalty = 1.05,
		stream = false,
	} = options;

	const apiKey = process.env.TYPHOON_API_KEY;
	if (!apiKey) {
		throw new Error('Missing TYPHOON_API_KEY in environment');
	}

	const payload = {
		model: TYPHOON_MODEL,
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userMessage },
		],
		max_tokens,
		temperature,
		top_p,
		repetition_penalty,
		stream,
	};

	const response = await fetch(TYPHOON_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Typhoon API error ${response.status}: ${text}`);
	}

	const data = await response.json();
	const content = data?.choices?.[0]?.message?.content ?? '';
	return { raw: data, content };
}


