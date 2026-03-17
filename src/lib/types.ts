export type Map = {
	id: string;
	name: string;
	slug: string;
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

export type Stage = {
	id: string;
	rotation_id: string;
	stage_number: number;
	modifier_id: string | null;
	modifier?: Modifier;
};

export type Round = {
	id: string;
	stage_id: string;
	round_number: number;
};

export type Spawn = {
	id: string;
	round_id: string;
	spawn_index: number;
	location: 'Pagoda' | 'Cemetery' | 'Courtyard';
	element: 'Sun' | 'Moon' | 'Storm';
};

// Nested types for display
export type RoundWithSpawns = Round & {
	spawns: Spawn[];
};

export type StageWithRounds = Stage & {
	rounds: RoundWithSpawns[];
};

export type RotationWithStages = Rotation & {
	stages: StageWithRounds[];
	map?: Map;
};

export type MapWithRotation = Map & {
	rotation: RotationWithStages | null;
};
