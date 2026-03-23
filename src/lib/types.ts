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
