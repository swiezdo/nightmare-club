import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getCurrentWeekStart } from '$lib/dates';
import { ROUND_COUNT, ROUND_STRUCTURE, ATTUNEMENT_MAP_SLUGS } from '$lib/constants';
import type { UpsertRotationPayload } from '$lib/types';

const SPAWN_POINT_MAX_LENGTH = 15;

function normalizeSpawnPoint(value: FormDataEntryValue | null): string | null {
	const raw = typeof value === 'string' ? value.trim() : '';
	if (!raw) return null;
	return raw.slice(0, SPAWN_POINT_MAX_LENGTH);
}

function normalizeCreditText(value: FormDataEntryValue | null): string | null {
	const raw = typeof value === 'string' ? value.trim() : '';
	return raw || null;
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
		const credit_text = normalizeCreditText(formData.get('credit_text'));
		const mapHasAttunements = ATTUNEMENT_MAP_SLUGS.has(map_slug);

		if (!map_id || !week_start) {
			return fail(400, { error: 'Map and week start are required.' });
		}

		try {
			// Build nested payload for the RPC call
			const challenges: UpsertRotationPayload['challenges'] = [];
			const rounds: UpsertRotationPayload['rounds'] = [];

			for (let r = 1; r <= ROUND_COUNT; r++) {
				const challengeId = (formData.get(`challenge_round_${r}`) as string) || null;
				if (challengeId) {
					challenges.push({ challenge_id: challengeId, round_number: r });
				}

				const { waves: waveCount, spawns: spawnCount } =
					ROUND_STRUCTURE[r as keyof typeof ROUND_STRUCTURE];

				const waves: UpsertRotationPayload['rounds'][number]['waves'] = [];
				for (let w = 1; w <= waveCount; w++) {
					const spawns: UpsertRotationPayload['rounds'][number]['waves'][number]['spawns'] = [];
					for (let i = 1; i <= spawnCount; i++) {
						const location = formData.get(`round_${r}_wave_${w}_spawn_${i}_location`) as string;

						if (!location) {
							return fail(400, {
								error: `Missing spawn data for stage ${r}, wave ${w}, spawn ${i}.`
							});
						}

						let element: string[] = [];
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

							element = attunement2 ? [attunement1, attunement2] : [attunement1];
						}

						spawns.push({
							spawn_order: i,
							location,
							spawn_point: normalizeSpawnPoint(
								formData.get(`round_${r}_wave_${w}_spawn_${i}_spawn_point`)
							),
							element
						});
					}
					waves.push({ wave_number: w, spawns });
				}
				rounds.push({ round_number: r, waves });
			}

			const payload: UpsertRotationPayload = {
				map_id,
				week_start,
				credit_text,
				challenges,
				rounds
			};

			// Single RPC call replaces 5-7 sequential Supabase REST calls
			const { data: rotation_id, error: rpcError } = await supabase.rpc('upsert_rotation', {
				payload
			});

			if (rpcError) {
				return fail(500, { error: `Failed to save rotation: ${rpcError.message}` });
			}

			const totalElapsedMs = Math.round(performance.now() - startedAt);
			console.info('[admin save] rotation persisted', {
				rotation_id,
				map_id,
				week_start,
				has_credit_text: Boolean(credit_text),
				challenges: challenges.length,
				rounds: rounds.length,
				waves: rounds.reduce((sum, r) => sum + r.waves.length, 0),
				spawns: rounds.reduce(
					(sum, r) => sum + r.waves.reduce((ws, w) => ws + w.spawns.length, 0),
					0
				),
				totalElapsedMs
			});

			return { success: true, savedMapId: map_id };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
			return fail(500, { error: message });
		}
	}
};
