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
			stages:stages(
				*,
				modifier:modifiers(*),
				rounds:rounds(
					*,
					spawns:spawns(*)
				)
			)
		`
		)
		.eq('week_start', weekStartStr)
		.order('stage_number', { referencedTable: 'stages' })
		.order('round_number', { referencedTable: 'stages.rounds' })
		.order('spawn_index', { referencedTable: 'stages.rounds.spawns' });

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
				// Delete cascades through stages -> rounds -> spawns
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

			// Process each stage (1-4)
			for (let s = 1; s <= 4; s++) {
				const modifierVal = formData.get(`stage_${s}_modifier`) as string;
				const modifier_id = modifierVal || null;

				const { data: stage, error: stageError } = await supabase
					.from('stages')
					.insert({
						rotation_id: rotation.id,
						stage_number: s,
						modifier_id
					})
					.select()
					.single();

				if (stageError || !stage) {
					return fail(500, { error: `Failed to create stage ${s}: ${stageError?.message}` });
				}

				// Process each round (1-3)
				for (let r = 1; r <= 3; r++) {
					const { data: round, error: roundError } = await supabase
						.from('rounds')
						.insert({
							stage_id: stage.id,
							round_number: r
						})
						.select()
						.single();

					if (roundError || !round) {
						return fail(500, {
							error: `Failed to create round ${r} for stage ${s}: ${roundError?.message}`
						});
					}

					// Stages 1-3 have 3 spawns, stage 4 has 4 spawns
					const spawnCount = s <= 3 ? 3 : 4;

					for (let i = 1; i <= spawnCount; i++) {
						const location = formData.get(
							`stage_${s}_round_${r}_spawn_${i}_location`
						) as string;
						const element = formData.get(
							`stage_${s}_round_${r}_spawn_${i}_element`
						) as string;

						if (!location || !element) {
							return fail(400, {
								error: `Missing spawn data for stage ${s}, round ${r}, spawn ${i}.`
							});
						}

						const { error: spawnError } = await supabase.from('spawns').insert({
							round_id: round.id,
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
