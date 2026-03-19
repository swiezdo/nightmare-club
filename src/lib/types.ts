export type Map = {
	id: string;
	name: string;
	slug: string;
	locations: string[];
};

export type Modifier = {
	id: string;
	name: string;
};

export type Rotation = {
	id: string;
	map_id: string;
	week_start: string;
	created_at: string;
};

export type Round = {
	id: string;
	rotation_id: string;
	round_number: number;
	modifier_id: string | null;
	modifier?: Modifier;
};

export type Wave = {
	id: string;
	round_id: string;
	wave_number: number;
};

export type Spawn = {
	id: string;
	wave_id: string;
	spawn_index: number;
	location: string;
	element: 'Sun' | 'Moon' | 'Storm';
};

// Nested types for display
export type WaveWithSpawns = Wave & {
	spawns: Spawn[];
};

export type RoundWithWaves = Round & {
	waves: WaveWithSpawns[];
};

export type RotationWithRounds = Rotation & {
	rounds: RoundWithWaves[];
	map?: Map;
};

export type MapWithRotation = Map & {
	rotation: RotationWithRounds | null;
};
