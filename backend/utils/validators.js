import { VALID_SEX, VALID_TOPICS } from './constants.js';

export function isValidISODate(dateStr) {
	// Basic YYYY-MM-DD check and real date validation
	if (typeof dateStr !== 'string') return false;
	const m = dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
	if (!m) return false;
	const date = new Date(dateStr + 'T00:00:00Z');
	if (Number.isNaN(date.getTime())) return false;
	const [y, mm, d] = dateStr.split('-').map((x) => Number(x));
	return date.getUTCFullYear() === y && date.getUTCMonth() + 1 === mm && date.getUTCDate() === d;
}

export function isValidDDMMYYYY(dateStr) {
	if (typeof dateStr !== 'string') return false;
	const m = dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/);
	if (!m) return false;
	const [dd, mm, yyyy] = dateStr.split('/').map((x) => Number(x));
	const iso = `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
	return isValidISODate(iso);
}

export function validateUserInfo(userInfo) {
	if (!userInfo) return 'Missing userInfo';
	const { name, birthdate, sex, topic } = userInfo;
	if (!name || !birthdate || !sex || !topic) return 'Missing required userInfo fields';
	if (!isValidISODate(birthdate)) return 'Invalid birthdate format (YYYY-MM-DD)';
	if (!VALID_SEX.includes(sex)) return 'Invalid sex';
	if (!VALID_TOPICS.includes(topic)) return 'Invalid topic';
	return null;
}

export function validateFortuneInput(body) {
	const errors = [];
	const { name, birthdate, sex, topic, text } = body || {};

	if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
		errors.push({ field: 'name', message: '1..100 chars required' });
	}
	if (!birthdate || !isValidDDMMYYYY(birthdate)) {
		errors.push({ field: 'birthdate', message: 'Invalid date format DD/MM/YYYY' });
	}
	if (!sex || !VALID_SEX.includes(sex)) {
		errors.push({ field: 'sex', message: `Must be one of: ${VALID_SEX.join(', ')}` });
	}
	if (!topic || !VALID_TOPICS.includes(topic)) {
		errors.push({ field: 'topic', message: `Must be one of: ${VALID_TOPICS.join(', ')}` });
	}
	if (!text || typeof text !== 'string' || text.trim().length < 1 || text.trim().length > 2000) {
		errors.push({ field: 'text', message: '1..2000 chars required' });
	}

	return errors;
}

