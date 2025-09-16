import Fortune from '../models/Fortune.js';
import { validateFortuneInput } from '../utils/validators.js';
import { getTyphoonCompletion } from '../services/typhoonClient.js';

function buildSystemPrompt(input) {
	return `คุณคือ "อาจารย์คม" หมอดูสไตล์ตรงไปตรงมา ใช้ข้อมูลผู้ใช้เพื่อทำนายดวงอย่างเป็นจริง
---
User Information:
- Name: ${input.name}
- Birthdate: ${input.birthdate}
- Sex: ${input.sex}
- Concern Topic: ${input.topic}
---`;
}

export const createFortune = async (req, res) => {
	try {
		const errors = validateFortuneInput(req.body);
		if (errors.length) {
			return res.status(400).json({ error: 'ValidationError', details: errors });
		}
		const { name, birthdate, sex, topic, text } = req.body;

		const systemPrompt = buildSystemPrompt({ name, birthdate, sex, topic });
		const { content } = await getTyphoonCompletion(systemPrompt, text);

		const doc = await Fortune.create({ name, birthdate, sex, topic, text, prediction: content });
		return res.status(200).json({ id: String(doc._id), prediction: doc.prediction });
	} catch (err) {
		return res.status(500).json({ error: 'ServerError', details: err.message });
	}
};

export const listFortunes = async (_req, res) => {
	try {
		const docs = await Fortune.find({}).sort({ createdAt: -1 });
		const fortunes = docs.map((d) => {
			const createdAtIso = d.createdAt instanceof Date
				? d.createdAt.toISOString()
				: (typeof d._id?.getTimestamp === 'function'
					? d._id.getTimestamp().toISOString()
					: new Date().toISOString());
			return {
			id: String(d._id),
			name: d.name,
			birthdate: d.birthdate,
			sex: d.sex,
			topic: d.topic,
			text: d.text,
			prediction: d.prediction,
			created_at: createdAtIso,
		};
		});
		return res.json({ fortunes });
	} catch (err) {
		return res.status(500).json({ error: 'ServerError', details: err.message });
	}
};

export const updateFortune = async (req, res) => {
	try {
		const { id } = req.params;
		const errors = validateFortuneInput(req.body);
		if (errors.length) {
			return res.status(400).json({ error: 'ValidationError', details: errors });
		}
		const { name, birthdate, sex, topic, text } = req.body;

		const existing = await Fortune.findById(id);
		if (!existing) return res.status(404).json({ error: 'NotFound' });

		const systemPrompt = buildSystemPrompt({ name, birthdate, sex, topic });
		const { content } = await getTyphoonCompletion(systemPrompt, text);

		existing.name = name;
		existing.birthdate = birthdate;
		existing.sex = sex;
		existing.topic = topic;
		existing.text = text;
		existing.prediction = content;
		await existing.save();

		return res.status(200).json({ prediction: existing.prediction });
	} catch (err) {
		return res.status(500).json({ error: 'ServerError', details: err.message });
	}
};

export const deleteFortune = async (req, res) => {
	try {
		const { id } = req.params;
		const existing = await Fortune.findById(id);
		if (!existing) return res.status(404).json({ error: 'NotFound' });
		await existing.deleteOne();
		return res.status(200).json({ ok: true });
	} catch (err) {
		return res.status(500).json({ error: 'ServerError', details: err.message });
	}
};


