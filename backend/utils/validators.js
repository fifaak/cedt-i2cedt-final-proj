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

export function validateUserInfo(userInfo) {
	if (!userInfo) return 'Missing userInfo';
	const { name, birthdate, sex, topic } = userInfo;
	if (!name || !birthdate || !sex || !topic) return 'Missing required userInfo fields';
	if (!isValidISODate(birthdate)) return 'Invalid birthdate format (YYYY-MM-DD)';
	if (!VALID_SEX.includes(sex)) return 'Invalid sex';
	if (!VALID_TOPICS.includes(topic)) return 'Invalid topic';
	return null;
}


