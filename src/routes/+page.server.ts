import type { PageServerLoad } from './$types';
import type { MapWithRotation, RotationWithStages, StageWithRounds } from '$lib/types';

export const load: PageServerLoad = async (event) => {
	const { data: maps } = await event.locals.supabase
		.from('maps')
		.select('*')
		.order('name');

	if (!maps) {
		return { maps: [] as MapWithRotation[] };
	}

	const mapsWithRotations: MapWithRotation[] = [];

	for (const map of maps) {
		const { data: rotations } = await event.locals.supabase
			.from('rotations')
			.select(`
				*,
				stages(
					*,
					modifier:modifiers(*),
					rounds(
						*,
						spawns(*)
					)
				)
			`)
			.eq('map_id', map.id)
			.order('week_start', { ascending: false })
			.limit(1);

		const rotation = rotations?.[0] ?? null;

		if (rotation) {
			// Sort stages by stage_number
			rotation.stages.sort(
				(a: StageWithRounds, b: StageWithRounds) => a.stage_number - b.stage_number
			);

			// Sort rounds and spawns within each stage
			for (const stage of rotation.stages) {
				stage.rounds.sort(
					(a: { round_number: number }, b: { round_number: number }) =>
						a.round_number - b.round_number
				);
				for (const round of stage.rounds) {
					round.spawns.sort(
						(a: { spawn_index: number }, b: { spawn_index: number }) =>
							a.spawn_index - b.spawn_index
					);
				}
			}
		}

		mapsWithRotations.push({
			...map,
			rotation: rotation as RotationWithStages | null
		});
	}

	return { maps: mapsWithRotations };
};
