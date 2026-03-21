/** Attunement names and their display colours */
export const ATTUNEMENTS = {
	Sun: '#e07722',
	Moon: '#6289f5',
	Storm: '#47d12c'
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

/** Weekly reset: Tuesday 1:00 AM Australia/Sydney */
export const RESET_SCHEDULE = {
	weekday: 2, // 0=Sun … 6=Sat; 2=Tuesday
	hour: 1, // 1:00 AM
	timezone: 'Australia/Sydney'
} as const;
