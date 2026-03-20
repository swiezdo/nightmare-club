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
				challenge:challenges(*),
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
			.limit(1);

		if (rotError) {
			console.error(`Error fetching rotation for ${map.name}:`, rotError);
			continue;
		}

		const rotation = rotations?.[0] ?? null;
		const hasAttunements = ATTUNEMENT_MAP_SLUGS.has(map.slug);

		const rounds = rotation?.rounds
			?.sort((a: { round_number: number }, b: { round_number: number }) =>
				a.round_number - b.round_number
			)
			.map((round: { round_number: number; waves: any[] }) => ({
				round: round.round_number,
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
							.map((spawn: { location: string; element: string[] }) => ({
								location: spawn.location,
								...(hasAttunements && { attunements: spawn.element ?? [] })
							}))
					}))
			})) ?? [];

		result.push({
			name: map.name,
			slug: map.slug,
			locations: map.locations,
			challenge: rotation?.challenge
				? { name: rotation.challenge.name, description: rotation.challenge.description }
				: null,
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
