import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentWeekStart } from '$lib/dates';
import { ATTUNEMENT_MAP_SLUGS } from '$lib/constants';

export const GET: RequestHandler = async ({ locals }) => {
	const supabase = locals.supabase;
	const weekStart = getCurrentWeekStart();

	const { data: maps, error: mapsError } = await supabase
		.from('maps')
		.select('*')
		.order('name');

	if (mapsError || !maps) {
		return json({ error: 'Failed to fetch maps' }, { status: 500 });
	}

	const result = [];

	for (const map of maps) {
		const { data: rotations, error: rotError } = await supabase
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
			.eq('map_id', map.id)
			.eq('week_start', weekStart)
			.order('created_at', { ascending: false })
			.limit(1);

		if (rotError) {
			console.error(`Error fetching rotation for ${map.name}:`, rotError);
			continue;
		}

		const rotation = rotations?.[0] ?? null;
		const hasAttunements = ATTUNEMENT_MAP_SLUGS.has(map.slug);

		// Index challenges by round_number
		const challengeByRound = new Map<number, any>();
		for (const rc of rotation?.rotation_challenges ?? []) {
			if (rc.challenge) challengeByRound.set(rc.round_number, rc.challenge);
		}

		const rounds = rotation?.rounds
			?.sort((a: { round_number: number }, b: { round_number: number }) =>
				a.round_number - b.round_number
			)
			.map((round: { round_number: number; waves: any[] }) => {
				const roundChallenge = challengeByRound.get(round.round_number);
				return {
				round: round.round_number,
				...(roundChallenge && { challenge: { name: roundChallenge.name, description: roundChallenge.description } }),
				waves: round.waves
					.sort((a: { wave_number: number }, b: { wave_number: number }) =>
						a.wave_number - b.wave_number
					)
					.map((wave: { wave_number: number; spawns: any[] }) => ({
						wave: wave.wave_number,
						spawns: wave.spawns
							.sort((a: { spawn_order: number }, b: { spawn_order: number }) =>
								a.spawn_order - b.spawn_order
							)
							.map((spawn: { location: string; spawn_point: string | null; element: string[] }) => ({
								location: spawn.location,
								spawn_point: spawn.spawn_point,
								...(hasAttunements && { attunements: spawn.element ?? [] })
							}))
					}))
			};
		}) ?? [];

		result.push({
			name: map.name,
			slug: map.slug,
			locations: map.locations,
			credit_text: rotation?.credit_text ?? null,
			rounds
		});
	}

	return json(
		{ week_start: weekStart, maps: result },
		{
			headers: {
				'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
				'Access-Control-Allow-Origin': '*'
			}
		}
	);
};
