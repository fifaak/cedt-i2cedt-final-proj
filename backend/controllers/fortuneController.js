import mongoose from 'mongoose';
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

		let targetDoc = null;
		if (mongoose.isValidObjectId(id)) {
			targetDoc = await Fortune.findById(id);
		} else {
			// Composite session key support: name|birthdate|sex|topic
			const parts = String(id).split('|');
			if (parts.length !== 4) {
				return res.status(400).json({ error: 'BadRequest', details: 'Invalid id format' });
			}
			const [kName, kBirthdate, kSex, kTopic] = parts.map((s) => (s || '').trim());
			if (!kName || !kBirthdate || !kSex || !kTopic) {
				return res.status(400).json({ error: 'BadRequest', details: 'Invalid session key parts' });
			}
			// Use latest fortune in this session as the update target
			targetDoc = await Fortune.findOne({ name: kName, birthdate: kBirthdate, sex: kSex, topic: kTopic }).sort({ createdAt: -1 });
		}

		if (!targetDoc) return res.status(404).json({ error: 'NotFound' });

		const systemPrompt = buildSystemPrompt({ name, birthdate, sex, topic });
		const { content } = await getTyphoonCompletion(systemPrompt, text);

		targetDoc.name = name;
		targetDoc.birthdate = birthdate;
		targetDoc.sex = sex;
		targetDoc.topic = topic;
		targetDoc.text = text;
		targetDoc.prediction = content;
		await targetDoc.save();

		return res.status(200).json({ prediction: targetDoc.prediction });
	} catch (err) {
		return res.status(500).json({ error: 'ServerError', details: err.message });
	}
};

export const deleteFortune = async (req, res) => {
	try {
		const { id } = req.params;

		// If it's a valid ObjectId, delete by _id
		if (mongoose.isValidObjectId(id)) {
			const existing = await Fortune.findById(id);
			if (!existing) return res.status(404).json({ error: 'NotFound' });
			await existing.deleteOne();
			return res.status(200).json({ ok: true, deletedCount: 1 });
		}

		// Otherwise, support composite session key: name|birthdate|sex|topic
		// e.g., "hi|20/02/2000|male|overall"
		const parts = String(id).split('|');
		if (parts.length !== 4) {
			return res.status(400).json({ error: 'BadRequest', details: 'Invalid id format' });
		}
		const [name, birthdate, sex, topic] = parts.map((s) => (s || '').trim());
		if (!name || !birthdate || !sex || !topic) {
			return res.status(400).json({ error: 'BadRequest', details: 'Invalid session key parts' });
		}
		const result = await Fortune.deleteMany({ name, birthdate, sex, topic });
		return res.status(200).json({ ok: true, deletedCount: result.deletedCount || 0 });
	} catch (err) {
		return res.status(500).json({ error: 'ServerError', details: err.message });
	}
};


