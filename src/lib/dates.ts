import { RESET_SCHEDULE } from '$lib/constants';

type ZonedDateParts = {
	weekday: number;
	hour: number;
	dateStr: string;
};

function formatDateParts(year: number, month: number, day: number): string {
	const monthStr = String(month).padStart(2, '0');
	const dayStr = String(day).padStart(2, '0');
	return `${year}-${monthStr}-${dayStr}`;
}

function addDays(dateStr: string, days: number): string {
	const [year, month, day] = dateStr.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day, 12));
	date.setUTCDate(date.getUTCDate() + days);
	return formatDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function getZonedDateParts(date: Date): ZonedDateParts {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: RESET_SCHEDULE.timezone,
		weekday: 'short',
		hour: 'numeric',
		hour12: false,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(date);

	const weekdayStr = parts.find((part) => part.type === 'weekday')?.value ?? '';
	const dayMap: Record<string, number> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6
	};

	const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
	const month = Number(parts.find((part) => part.type === 'month')?.value ?? '0');
	const day = Number(parts.find((part) => part.type === 'day')?.value ?? '0');

	return {
		weekday: dayMap[weekdayStr] ?? 0,
		// Some Intl implementations emit "24" for times shortly after midnight.
		hour: parseInt(parts.find((part) => part.type === 'hour')?.value ?? '0', 10) % 24,
		dateStr: formatDateParts(year, month, day)
	};
}

/** Returns the current rotation week start date for the Melbourne reset schedule. */
export function getCurrentWeekStart(now = new Date()): string {
	const zoned = getZonedDateParts(now);
	let daysSinceReset = (zoned.weekday - RESET_SCHEDULE.weekday + 7) % 7;

	if (zoned.weekday === RESET_SCHEDULE.weekday && zoned.hour < RESET_SCHEDULE.hour) {
		daysSinceReset = 7;
	}

	return addDays(zoned.dateStr, -daysSinceReset);
}
