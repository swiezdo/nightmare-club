import type { PageServerLoad } from './$types';
import type { MapWithRotation, RotationWithRounds, RoundWithWaves } from '$lib/types';

export const load: PageServerLoad = async (event) => {
	const { data: maps, error: mapsError } = await event.locals.supabase
		.from('maps')
		.select('*')
		.order('name');

	if (mapsError) {
		console.error('Error fetching maps:', mapsError);
	}

	if (!maps || maps.length === 0) {
		return { maps: [] as MapWithRotation[] };
	}

	const mapsWithRotations: MapWithRotation[] = [];

	for (const map of maps) {
		const { data: rotations, error: rotError } = await event.locals.supabase
			.from('rotations')
			.select(`
				*,
				rounds(
					*,
					modifier:modifiers(*),
					waves(
						*,
						spawns(*)
					)
				)
			`)
			.eq('map_id', map.id)
			.order('week_start', { ascending: false })
			.limit(1);

		if (rotError) {
			console.error(`Error fetching rotation for ${map.name}:`, rotError);
		}

		const rotation = rotations?.[0] ?? null;

		if (rotation) {
			// Sort rounds by round_number
			rotation.rounds.sort(
				(a: RoundWithWaves, b: RoundWithWaves) => a.round_number - b.round_number
			);

			// Sort waves and spawns within each round
			for (const round of rotation.rounds) {
				round.waves.sort(
					(a: { wave_number: number }, b: { wave_number: number }) =>
						a.wave_number - b.wave_number
				);
				for (const wave of round.waves) {
					wave.spawns.sort(
						(a: { spawn_index: number }, b: { spawn_index: number }) =>
							a.spawn_index - b.spawn_index
					);
				}
			}
		}

		mapsWithRotations.push({
			...map,
			rotation: rotation as RotationWithRounds | null
		});
	}

	return { maps: mapsWithRotations };
};
