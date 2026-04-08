export type Map = {
	id: string;
	name: string;
	slug: string;
	locations: string[];
};

export type Challenge = {
	id: string;
	name: string;
	description: string;
};

export type Rotation = {
	id: string;
	map_id: string;
	week_start: string;
	created_at: string;
	credit_text: string | null;
	challenge_id: string | null;
	challenge?: Challenge;
	rotation_challenges?: { challenge: Challenge; round_number: number }[];
};

export type Round = {
	id: string;
	rotation_id: string;
	round_number: number;
};

export type Wave = {
	id: string;
	round_id: string;
	wave_number: number;
};

export type Spawn = {
	id: string;
	round_id: string;
	spawn_order: number;
	location: string;
	spawn_point: string | null;
	element: string[];
};

// Nested types for display
export type WaveWithSpawns = Wave & {
	spawns: Spawn[];
};

export type RoundWithWaves = Round & {
	waves: WaveWithSpawns[];
	challenge?: Challenge;
};

export type RotationWithRounds = Rotation & {
	rounds: RoundWithWaves[];
	map?: Map;
};

export type MapWithRotation = Map & {
	rotation: RotationWithRounds | null;
};

export type UpsertRotationPayload = {
	rotation_id?: string | null;
	map_id: string;
	week_start: string;
	credit_text: string | null;
	challenges: { challenge_id: string; round_number: number }[];
	rounds: {
		round_number: number;
		waves: {
			wave_number: number;
			spawns: {
				spawn_order: number;
				location: string;
				spawn_point: string | null;
				element: string[];
			}[];
		}[];
	}[];
};

/** Ghost of Tsushima — map metadata and stored rotation JSON */
export type TsushimaZone = { zone: string; spawns: string[] };

export type TsushimaWeekOption = {
	code: string;
	modifiers: { slot: number; name: string; icon: string }[];
};

export type TsushimaMapRow = {
	id: string;
	slug: string;
	name: string;
	zones: TsushimaZone[];
	week_options: TsushimaWeekOption[];
	objectives: unknown;
	wave_modifiers: unknown;
};

export type TsushimaWaveSpawn = { order: number; zone: string; spawn: string };

export type TsushimaWaveRow = { wave: number; spawns: TsushimaWaveSpawn[] };

export type TsushimaPayloadJson = {
	map: { slug: string; name: string };
	week_start: string;
	week_code: string;
	credit_text: string | null;
	weekly_modifiers: TsushimaWeekOption['modifiers'];
	bonus_objectives: unknown;
	wave_modifiers: unknown;
	waves: TsushimaWaveRow[];
};

export type TsushimaRotationRow = {
	id: string;
	map_id: string;
	week_start: string;
	week_code: string;
	credit_text: string | null;
	payload: TsushimaPayloadJson;
	created_at?: string;
	updated_at?: string;
};

export type TsushimaMapWithRotation = TsushimaMapRow & {
	rotation: TsushimaRotationRow;
};
