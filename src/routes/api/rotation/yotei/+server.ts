import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentWeekStart } from '$lib/dates';
import { ATTUNEMENT_MAP_SLUGS } from '$lib/constants';
import { requireBearerToken } from '$lib/server/bot-api';
import { env } from '$env/dynamic/private';

/** Read-only Yōtei rotation for the current Melbourne week (same anchor as the home page). Bearer only. */
export const GET: RequestHandler = async ({ request, locals }) => {
	const authError = requireBearerToken(request, env.BOT_API_TOKEN_YOTEI);
	if (authError) return authError;

	const supabase = locals.supabase;
	const weekStart = getCurrentWeekStart();

	const { data: maps, error: mapsError } = await supabase.from('maps').select('*').order('name');

	if (mapsError || !maps) {
		console.error('[api/rotation/yotei] maps', mapsError);
		return json({ error: 'Failed to fetch maps' }, { status: 500 });
	}

	const result: Array<{
		name: string;
		slug: string;
		credit_text: string | null;
		rounds: Array<{
			round: number;
			challenge?: { name: string; description: string | null };
			waves: Array<{
				wave: number;
				spawns: Array<{
					order: number;
					location: string;
					spawn_point: string | null;
					attunements?: string[];
				}>;
			}>;
		}>;
	}> = [];

	for (const map of maps) {
		const { data: rotations, error: rotError } = await supabase
			.from('rotations')
			.select(
				`
				*,
				rotation_challenges(round_number, challenge:challenges(*)),
				rounds(
					*,
					waves(
						*,
						spawns(*)
					)
				)
			`
			)
			.eq('map_id', map.id)
			.eq('week_start', weekStart)
			.order('created_at', { ascending: false })
			.limit(1);

		if (rotError) {
			console.error(`[api/rotation/yotei] rotation for ${map.name}:`, rotError);
			continue;
		}

		const rotation = rotations?.[0] ?? null;
		if (!rotation) continue;

		const hasAttunements = ATTUNEMENT_MAP_SLUGS.has(map.slug);

		const challengeByRound = new Map<number, { name: string; description: string | null }>();
		for (const rc of rotation.rotation_challenges ?? []) {
			const ch = rc.challenge as { name?: string; description?: string | null } | undefined;
			if (ch?.name) {
				challengeByRound.set(rc.round_number, {
					name: ch.name,
					description: ch.description ?? null
				});
			}
		}

		const rounds =
			rotation.rounds
				?.sort((a: { round_number: number }, b: { round_number: number }) =>
					a.round_number - b.round_number
				)
				.map((round: { round_number: number; waves: any[] }) => {
					const roundChallenge = challengeByRound.get(round.round_number);
					return {
						round: round.round_number,
						...(roundChallenge && { challenge: roundChallenge }),
						waves: round.waves
							.sort(
								(a: { wave_number: number }, b: { wave_number: number }) =>
									a.wave_number - b.wave_number
							)
							.map((wave: { wave_number: number; spawns: any[] }) => ({
								wave: wave.wave_number,
								spawns: wave.spawns
									.sort(
										(a: { spawn_order: number }, b: { spawn_order: number }) =>
											a.spawn_order - b.spawn_order
									)
									.map(
										(spawn: {
											spawn_order: number;
											location: string;
											spawn_point: string | null;
											element: string[];
										}) => ({
											order: spawn.spawn_order,
											location: spawn.location,
											spawn_point: spawn.spawn_point,
											...(hasAttunements && { attunements: spawn.element ?? [] })
										})
									)
							}))
					};
				}) ?? [];

		result.push({
			name: map.name,
			slug: map.slug,
			credit_text: rotation.credit_text ?? null,
			rounds
		});
	}

	return json(
		{ maps: result },
		{
			headers: {
				'Cache-Control': 'private, no-store'
			}
		}
	);
};
