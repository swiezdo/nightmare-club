import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getCurrentWeekStart } from '$lib/dates';
import { ROUND_COUNT, ROUND_STRUCTURE, ATTUNEMENT_MAP_SLUGS } from '$lib/constants';

const SPAWN_POINT_MAX_LENGTH = 15;

function normalizeSpawnPoint(value: FormDataEntryValue | null): string | null {
	const raw = typeof value === 'string' ? value.trim() : '';
	if (!raw) return null;
	return raw.slice(0, SPAWN_POINT_MAX_LENGTH);
}

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;

	const [mapsRes, challengesRes] = await Promise.all([
		supabase.from('maps').select('*').order('name'),
		supabase.from('challenges').select('*').order('name')
	]);

	const maps = mapsRes.data ?? [];
	const challenges = challengesRes.data ?? [];

	const weekStartStr = getCurrentWeekStart();

	// Fetch existing rotations for this week
	const { data: existingRotations } = await supabase
		.from('rotations')
		.select(
			`
			*,
			rotation_challenges(round_number, challenge:challenges(*)),
			rounds:rounds(
				*,
				waves:waves(
					*,
					spawns:spawns(*)
				)
			)
		`
		)
		.eq('week_start', weekStartStr)
		.order('round_number', { referencedTable: 'rounds' })
		.order('wave_number', { referencedTable: 'rounds.waves' })
		.order('spawn_order', { referencedTable: 'rounds.waves.spawns' });

	return {
		maps,
		challenges,
		weekStart: weekStartStr,
		existingRotations: existingRotations ?? []
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const supabase = locals.supabase;
		const formData = await request.formData();
		const startedAt = performance.now();

		const map_id = formData.get('map_id') as string;
		const week_start = formData.get('week_start') as string;
		const map_slug = formData.get('map_slug') as string;
		const mapHasAttunements = ATTUNEMENT_MAP_SLUGS.has(map_slug);

		if (!map_id || !week_start) {
			return fail(400, { error: 'Map and week start are required.' });
		}

		try {
			const lookupStartedAt = performance.now();
			// Delete existing rotation for this map+week if exists
			const { data: existing } = await supabase
				.from('rotations')
				.select('id')
				.eq('map_id', map_id)
				.eq('week_start', week_start)
				.maybeSingle();

			if (existing) {
				// Delete cascades through rounds -> waves -> spawns + rotation_challenges
				await supabase.from('rotations').delete().eq('id', existing.id);
			}
			const lookupElapsedMs = Math.round(performance.now() - lookupStartedAt);

			const payloadStartedAt = performance.now();
			const challengeRows = [];
			const roundRows = [];
			const wavesToInsert: { round_number: number; wave_number: number }[] = [];
			const spawnDrafts: {
				round_number: number;
				wave_number: number;
				spawn_order: number;
				location: string;
				spawn_point: string | null;
				element: string[];
			}[] = [];

			for (let r = 1; r <= ROUND_COUNT; r++) {
				const challengeId = (formData.get(`challenge_round_${r}`) as string) || null;
				if (challengeId) {
					challengeRows.push({
						challenge_id: challengeId,
						round_number: r
					});
				}

				roundRows.push({
					round_number: r
				});

				const { waves: waveCount, spawns: spawnCount } =
					ROUND_STRUCTURE[r as keyof typeof ROUND_STRUCTURE];

				for (let w = 1; w <= waveCount; w++) {
					wavesToInsert.push({
						round_number: r,
						wave_number: w
					});

					for (let i = 1; i <= spawnCount; i++) {
						const location = formData.get(`round_${r}_wave_${w}_spawn_${i}_location`) as string;

						if (!location) {
							return fail(400, {
								error: `Missing spawn data for stage ${r}, wave ${w}, spawn ${i}.`
							});
						}

						let attunements: string[] = [];
						if (mapHasAttunements) {
							const attunement1 = formData.get(
								`round_${r}_wave_${w}_spawn_${i}_attunement_1`
							) as string;
							const attunement2 = formData.get(
								`round_${r}_wave_${w}_spawn_${i}_attunement_2`
							) as string;

							if (!attunement1) {
								return fail(400, {
									error: `Missing attunement for stage ${r}, wave ${w}, spawn ${i}.`
								});
							}

							attunements = [attunement1];
							if (attunement2) {
								attunements.push(attunement2);
							}
						}

						spawnDrafts.push({
							round_number: r,
							wave_number: w,
							spawn_order: i,
							location,
							spawn_point: normalizeSpawnPoint(
								formData.get(`round_${r}_wave_${w}_spawn_${i}_spawn_point`)
							),
							element: attunements
						});
					}
				}
			}
			const payloadElapsedMs = Math.round(performance.now() - payloadStartedAt);

			const insertStartedAt = performance.now();
			// Insert new rotation
			const { data: rotation, error: rotError } = await supabase
				.from('rotations')
				.insert({ map_id, week_start })
				.select()
				.single();

			if (rotError || !rotation) {
				return fail(500, { error: `Failed to create rotation: ${rotError?.message}` });
			}

			// Insert per-stage challenge associations
			if (challengeRows.length > 0) {
				const { error: challengeError } = await supabase
					.from('rotation_challenges')
					.insert(
						challengeRows.map((row) => ({
							rotation_id: rotation.id,
							challenge_id: row.challenge_id,
							round_number: row.round_number
						}))
					);

				if (challengeError) {
					return fail(500, { error: `Failed to save challenges: ${challengeError.message}` });
				}
			}

			const { data: rounds, error: roundError } = await supabase
				.from('rounds')
				.insert(
					roundRows.map((row) => ({
						rotation_id: rotation.id,
						round_number: row.round_number
					}))
				)
				.select('id, round_number');

			if (roundError || !rounds) {
				return fail(500, { error: `Failed to create stages: ${roundError?.message}` });
			}

			const roundIdByNumber = new Map(rounds.map((round) => [round.round_number, round.id]));
			const { data: waves, error: waveError } = await supabase
				.from('waves')
				.insert(
					wavesToInsert.map((wave) => ({
						round_id: roundIdByNumber.get(wave.round_number),
						wave_number: wave.wave_number
					}))
				)
				.select('id, round_id, wave_number');

			if (waveError || !waves) {
				return fail(500, { error: `Failed to create waves: ${waveError?.message}` });
			}

			const waveIdByRoundAndWave = new Map(
				waves.map((wave) => [`${wave.round_id}:${wave.wave_number}`, wave.id])
			);
			const { error: spawnError } = await supabase.from('spawns').insert(
				spawnDrafts.map((spawn) => ({
					round_id: waveIdByRoundAndWave.get(
						`${roundIdByNumber.get(spawn.round_number)}:${spawn.wave_number}`
					),
					spawn_order: spawn.spawn_order,
					location: spawn.location,
					spawn_point: spawn.spawn_point,
					element: spawn.element
				}))
			);

			if (spawnError) {
				return fail(500, {
					error: `Failed to create spawns: ${spawnError.message}`
				});
			}
			const insertElapsedMs = Math.round(performance.now() - insertStartedAt);
			const totalElapsedMs = Math.round(performance.now() - startedAt);
			console.info('[admin save] rotation persisted', {
				map_id,
				week_start,
				challenges: challengeRows.length,
				rounds: roundRows.length,
				waves: wavesToInsert.length,
				spawns: spawnDrafts.length,
				lookupElapsedMs,
				payloadElapsedMs,
				insertElapsedMs,
				totalElapsedMs
			});

			return { success: true, savedMapId: map_id };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
			return fail(500, { error: message });
		}
	}
};
