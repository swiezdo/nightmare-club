import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getCurrentWeekStart } from '$lib/dates';
import { ROUND_COUNT, ROUND_STRUCTURE, ATTUNEMENT_MAP_SLUGS } from '$lib/constants';

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
			challenge:challenges(*),
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

		const map_id = formData.get('map_id') as string;
		const week_start = formData.get('week_start') as string;
		const challenge_id = (formData.get('challenge_id') as string) || null;
		const map_slug = formData.get('map_slug') as string;
		const mapHasAttunements = ATTUNEMENT_MAP_SLUGS.has(map_slug);

		if (!map_id || !week_start) {
			return fail(400, { error: 'Map and week start are required.' });
		}

		try {
			// Delete existing rotation for this map+week if exists
			const { data: existing } = await supabase
				.from('rotations')
				.select('id')
				.eq('map_id', map_id)
				.eq('week_start', week_start)
				.maybeSingle();

			if (existing) {
				// Delete cascades through rounds -> waves -> spawns
				await supabase.from('rotations').delete().eq('id', existing.id);
			}

			// Insert new rotation
			const { data: rotation, error: rotError } = await supabase
				.from('rotations')
				.insert({ map_id, week_start, challenge_id })
				.select()
				.single();

			if (rotError || !rotation) {
				return fail(500, { error: `Failed to create rotation: ${rotError?.message}` });
			}

			for (let r = 1; r <= ROUND_COUNT; r++) {
				const { data: round, error: roundError } = await supabase
					.from('rounds')
					.insert({
						rotation_id: rotation.id,
						round_number: r
					})
					.select()
					.single();

				if (roundError || !round) {
					return fail(500, { error: `Failed to create stage ${r}: ${roundError?.message}` });
				}

				const { waves: waveCount, spawns: spawnCount } =
					ROUND_STRUCTURE[r as keyof typeof ROUND_STRUCTURE];

				for (let w = 1; w <= waveCount; w++) {
					const { data: wave, error: waveError } = await supabase
						.from('waves')
						.insert({
							round_id: round.id,
							wave_number: w
						})
						.select()
						.single();

					if (waveError || !wave) {
						return fail(500, {
							error: `Failed to create wave ${w} for stage ${r}: ${waveError?.message}`
						});
					}

					for (let i = 1; i <= spawnCount; i++) {
						const location = formData.get(
							`round_${r}_wave_${w}_spawn_${i}_location`
						) as string;

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

						const { error: spawnError } = await supabase.from('spawns').insert({
							round_id: wave.id,
							spawn_order: i,
							location,
							element: attunements
						});

						if (spawnError) {
							return fail(500, {
								error: `Failed to create spawn: ${spawnError.message}`
							});
						}
					}
				}
			}

			return { success: true, savedMapId: map_id };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
			return fail(500, { error: message });
		}
	}
};
