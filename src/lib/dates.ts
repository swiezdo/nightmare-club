import { RESET_SCHEDULE, TSUSHIMA_RESET_SCHEDULE, type ResetSchedule } from '$lib/constants';

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

const WEEKDAY_PARTS: Record<string, number> = {
	Sun: 0,
	Mon: 1,
	Tue: 2,
	Wed: 3,
	Thu: 4,
	Fri: 5,
	Sat: 6
};

export function getZonedDateParts(date: Date, timeZone: string): ZonedDateParts {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		weekday: 'short',
		hour: 'numeric',
		hour12: false,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(date);

	const weekdayStr = parts.find((part) => part.type === 'weekday')?.value ?? '';

	const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
	const month = Number(parts.find((part) => part.type === 'month')?.value ?? '0');
	const day = Number(parts.find((part) => part.type === 'day')?.value ?? '0');

	return {
		weekday: WEEKDAY_PARTS[weekdayStr] ?? 0,
		hour: parseInt(parts.find((part) => part.type === 'hour')?.value ?? '0', 10) % 24,
		dateStr: formatDateParts(year, month, day)
	};
}

/**
 * Calendar `week_start` date for the rotation that is live at `now`,
 * relative to a fixed local weekday+hour reset in `schedule.timezone`.
 */
export function getWeekStartForSchedule(schedule: ResetSchedule, now = new Date()): string {
	const zoned = getZonedDateParts(now, schedule.timezone);
	let daysSinceReset = (zoned.weekday - schedule.weekday + 7) % 7;

	if (zoned.weekday === schedule.weekday && zoned.hour < schedule.hour) {
		daysSinceReset = 7;
	}

	return addDays(zoned.dateStr, -daysSinceReset);
}

/** Yōtei / Melbourne rotation week (Tuesday date). */
export function getCurrentWeekStart(now = new Date()): string {
	return getWeekStartForSchedule(RESET_SCHEDULE, now);
}

/** Tsushima rotation week (Friday date for the in-game weekly boundary). */
export function getTsushimaWeekStart(now = new Date()): string {
	return getWeekStartForSchedule(TSUSHIMA_RESET_SCHEDULE, now);
}

function utcOffsetCandidates(timeZone: string): number[] {
	if (timeZone === 'Europe/Moscow') return [3, 4, 2];
	if (timeZone === 'Australia/Melbourne') return [11, 10];
	return [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 13, 14, 15];
}

/** Milliseconds of the next reset instant after `nowMs` for the given schedule. */
export function getNextResetMs(schedule: ResetSchedule, nowMs = Date.now()): number {
	const date = new Date(nowMs);
	const z = getZonedDateParts(date, schedule.timezone);

	let daysAhead = (schedule.weekday - z.weekday + 7) % 7;
	if (daysAhead === 0 && z.hour >= schedule.hour) daysAhead = 7;

	const target = new Date(nowMs + daysAhead * 86400000);
	const targetZ = getZonedDateParts(target, schedule.timezone);
	const targetStr = targetZ.dateStr;
	const resetHourStr = String(schedule.hour).padStart(2, '0');

	for (const offsetHours of utcOffsetCandidates(schedule.timezone)) {
		const utcMs =
			new Date(`${targetStr}T${resetHourStr}:00:00Z`).getTime() - offsetHours * 3600000;
		const check = new Intl.DateTimeFormat('en-US', {
			timeZone: schedule.timezone,
			hour: 'numeric',
			hour12: false
		}).format(new Date(utcMs));
		if (parseInt(check, 10) % 24 === schedule.hour % 24) {
			return utcMs;
		}
	}

	return new Date(`${targetStr}T${resetHourStr}:00:00Z`).getTime() - 3 * 3600000;
}
