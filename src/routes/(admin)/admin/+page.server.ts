import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;

	const [mapsRes, modifiersRes] = await Promise.all([
		supabase.from('maps').select('*').order('name'),
		supabase.from('modifiers').select('*').order('name')
	]);

	const maps = mapsRes.data ?? [];
	const modifiers = modifiersRes.data ?? [];

	// Calculate current week_start (most recent Saturday)
	const now = new Date();
	const day = now.getDay(); // 0=Sun
	const diff = (day + 1) % 7; // days since last Saturday
	const weekStart = new Date(now);
	weekStart.setDate(now.getDate() - diff);
	const weekStartStr = weekStart.toISOString().split('T')[0];

	// Fetch existing rotations for this week
	const { data: existingRotations } = await supabase
		.from('rotations')
		.select(
			`
			*,
			rounds:rounds(
				*,
				modifier:modifiers(*),
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
		.order('spawn_index', { referencedTable: 'rounds.waves.spawns' });

	return {
		maps,
		modifiers,
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
				.insert({ map_id, week_start })
				.select()
				.single();

			if (rotError || !rotation) {
				return fail(500, { error: `Failed to create rotation: ${rotError?.message}` });
			}

			// Process each round (1-4)
			for (let r = 1; r <= 4; r++) {
				const modifierVal = formData.get(`round_${r}_modifier`) as string;
				const modifier_id = modifierVal || null;

				const { data: round, error: roundError } = await supabase
					.from('rounds')
					.insert({
						rotation_id: rotation.id,
						round_number: r,
						modifier_id
					})
					.select()
					.single();

				if (roundError || !round) {
					return fail(500, { error: `Failed to create round ${r}: ${roundError?.message}` });
				}

				// Rounds 1-3: 3 waves, Round 4: 4 waves
				const waveCount = r <= 3 ? 3 : 4;

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
							error: `Failed to create wave ${w} for round ${r}: ${waveError?.message}`
						});
					}

					// Rounds 1-3: 3 spawns per wave, Round 4: 4 spawns per wave
					const spawnCount = r <= 3 ? 3 : 4;

					for (let i = 1; i <= spawnCount; i++) {
						const location = formData.get(
							`round_${r}_wave_${w}_spawn_${i}_location`
						) as string;
						const element = formData.get(
							`round_${r}_wave_${w}_spawn_${i}_element`
						) as string;

						if (!location || !element) {
							return fail(400, {
								error: `Missing spawn data for round ${r}, wave ${w}, spawn ${i}.`
							});
						}

						const { error: spawnError } = await supabase.from('spawns').insert({
							round_id: wave.id,
							spawn_index: i,
							location,
							element
						});

						if (spawnError) {
							return fail(500, {
								error: `Failed to create spawn: ${spawnError.message}`
							});
						}
					}
				}
			}

			return { success: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
			return fail(500, { error: message });
		}
	}
};
