/** Attunement names and their display colours */
export const ATTUNEMENTS = {
	Sun: '#e07722',
	Moon: '#3b5ec9',
	Storm: '#2d8a1e'
} as const;

export const ATTUNEMENT_NAMES = Object.keys(ATTUNEMENTS) as (keyof typeof ATTUNEMENTS)[];

/** Per-round structure: [round_number]: { waves, spawns } */
export const ROUND_STRUCTURE = {
	1: { waves: 3, spawns: 3 },
	2: { waves: 3, spawns: 3 },
	3: { waves: 3, spawns: 3 },
	4: { waves: 3, spawns: 4 }
} as const;

export const ROUND_COUNT = 4;

/** Maps that support attunement tracking */
export const ATTUNEMENT_MAP_SLUGS = new Set(['hidden-temple']);

/** Shared shape for weekly in-game reset anchoring */
export type ResetSchedule = {
	readonly weekday: number;
	readonly hour: number;
	readonly timezone: string;
};

/** Ghost of Yōtei: Tuesday 1:00 AM Australia/Melbourne */
export const RESET_SCHEDULE = {
	weekday: 2, // 0=Sun … 6=Sat; 2=Tuesday
	hour: 1, // 1:00 AM
	timezone: 'Australia/Melbourne'
} as const satisfies ResetSchedule;

/** Ghost of Tsushima: in-game weekly refresh Friday 18:00 (Europe/Moscow tz in code only — UI shows local time). */
export const TSUSHIMA_RESET_SCHEDULE = {
	weekday: 5,
	hour: 18,
	timezone: 'Europe/Moscow'
} as const satisfies ResetSchedule;
