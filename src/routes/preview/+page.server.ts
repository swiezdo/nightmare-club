import type { PageServerLoad } from './$types';
import type { MapWithRotation, RotationWithRounds, RoundWithWaves } from '$lib/types';
import { getCurrentWeekStart } from '$lib/dates';

export const load: PageServerLoad = async (event) => {
	const weekStart = getCurrentWeekStart();

	const [mapsResult, rotationsResult] = await Promise.all([
		event.locals.supabase.from('maps').select('*').order('name'),
		event.locals.supabase
			.from('rotations')
			.select(`
				*,
				rotation_challenges(round_number, challenge:challenges(*)),
				rounds(
					*,
					waves(
						*,
						spawns(*)
					)
				)
			`)
			.eq('week_start', weekStart)
			.order('created_at', { ascending: false })
	]);

	if (mapsResult.error) console.error('Error fetching maps:', mapsResult.error);
	if (rotationsResult.error) console.error('Error fetching rotations:', rotationsResult.error);

	const maps = mapsResult.data;
	const rotations = rotationsResult.data;

	if (!maps || maps.length === 0) {
		return { maps: [] as MapWithRotation[] };
	}

	const rotationByMapId = new Map<string, RotationWithRounds>();
	for (const rotation of rotations ?? []) {
		rotation.rounds.sort(
			(a: RoundWithWaves, b: RoundWithWaves) => a.round_number - b.round_number
		);
		for (const round of rotation.rounds) {
			round.waves.sort(
				(a: { wave_number: number }, b: { wave_number: number }) =>
					a.wave_number - b.wave_number
			);
			for (const wave of round.waves) {
				wave.spawns.sort(
					(a: { spawn_order: number }, b: { spawn_order: number }) =>
						a.spawn_order - b.spawn_order
				);
			}
		}

		const rcByRound = new Map<number, any>();
		for (const rc of (rotation as any).rotation_challenges ?? []) {
			if (rc.challenge) rcByRound.set(rc.round_number, rc.challenge);
		}
		for (const round of rotation.rounds) {
			(round as any).challenge = rcByRound.get(round.round_number) ?? undefined;
		}

		rotationByMapId.set(rotation.map_id, rotation as RotationWithRounds);
	}

	const mapsWithRotations: MapWithRotation[] = maps
		.filter((map) => rotationByMapId.has(map.id))
		.map((map) => ({
			...map,
			rotation: rotationByMapId.get(map.id)!
		}));

	event.setHeaders({
		'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
	});

	return { maps: mapsWithRotations };
};
