import type { PageServerLoad } from './$types';
import type {
	MapWithRotation,
	RotationWithRounds,
	RoundWithWaves,
	TsushimaMapWithRotation,
	TsushimaPayloadJson
} from '$lib/types';
import { getCurrentWeekStart, getTsushimaWeekStart } from '$lib/dates';

function normalizeTsushimaPayload(raw: unknown): TsushimaPayloadJson | null {
	if (!raw || typeof raw !== 'object' || !('waves' in raw)) return null;
	const p = raw as TsushimaPayloadJson;
	if (!Array.isArray(p.waves)) return null;
	return p;
}

export const load: PageServerLoad = async (event) => {
	const yoteiWeekStart = getCurrentWeekStart();
	const tsushimaWeekStart = getTsushimaWeekStart();

	const [mapsResult, rotationsResult, tsushimaMapsResult, tsushimaRotationsResult] =
		await Promise.all([
			event.locals.supabase.from('maps').select('*').order('name'),
			event.locals.supabase
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
				.eq('week_start', yoteiWeekStart)
				.order('created_at', { ascending: false }),
			event.locals.supabase.from('tsushima_maps').select('*').order('name'),
			event.locals.supabase
				.from('tsushima_rotations')
				.select('*')
				.eq('week_start', tsushimaWeekStart)
		]);

	if (mapsResult.error) {
		console.error('Error fetching maps:', mapsResult.error);
	}
	if (rotationsResult.error) {
		console.error('Error fetching rotations:', rotationsResult.error);
	}
	if (tsushimaMapsResult.error) {
		console.error('Error fetching tsushima_maps:', tsushimaMapsResult.error);
	}
	if (tsushimaRotationsResult.error) {
		console.error('Error fetching tsushima_rotations:', tsushimaRotationsResult.error);
	}

	const maps = mapsResult.data ?? [];
	const rotations = rotationsResult.data ?? [];

	const rotationByMapId = new Map<string, RotationWithRounds>();
	for (const rotation of rotations) {
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

		const rcByRound = new Map<number, unknown>();
		for (const rc of (rotation as unknown as { rotation_challenges?: unknown[] }).rotation_challenges ?? []) {
			const entry = rc as { round_number: number; challenge?: unknown };
			if (entry.challenge) rcByRound.set(entry.round_number, entry.challenge);
		}
		for (const round of rotation.rounds) {
			(round as unknown as { challenge?: unknown }).challenge =
				rcByRound.get(round.round_number) ?? undefined;
		}

		rotationByMapId.set(rotation.map_id, rotation as RotationWithRounds);
	}

	const mapsWithRotations: MapWithRotation[] = maps
		.filter((map) => rotationByMapId.has(map.id))
		.map((map) => ({
			...map,
			rotation: rotationByMapId.get(map.id)!
		}));

	const tsuMaps = tsushimaMapsResult.data ?? [];
	const tsuRots = tsushimaRotationsResult.data ?? [];
	const tsuRotByMapId = new Map(tsuRots.map((r) => [r.map_id, r]));

	const tsushimaMaps: TsushimaMapWithRotation[] = tsuMaps
		.filter((m) => tsuRotByMapId.has(m.id))
		.map((m) => {
			const row = tsuRotByMapId.get(m.id)! as {
				id: string;
				map_id: string;
				week_start: string;
				week_code: string;
				credit_text: string | null;
				payload: unknown;
				created_at?: string;
				updated_at?: string;
			};
			const parsed = normalizeTsushimaPayload(row.payload);
			const payload: TsushimaPayloadJson =
				parsed ?? {
					map: { slug: m.slug, name: m.name },
					week_start: String(row.week_start).slice(0, 10),
					week_code: row.week_code,
					credit_text: row.credit_text,
					weekly_modifiers: [],
					bonus_objectives: m.objectives,
					wave_modifiers: m.wave_modifiers,
					waves: []
				};
			return {
				id: m.id,
				slug: m.slug,
				name: m.name,
				zones: m.zones as TsushimaMapWithRotation['zones'],
				week_options: m.week_options as TsushimaMapWithRotation['week_options'],
				objectives: m.objectives,
				wave_modifiers: m.wave_modifiers,
				rotation: {
					id: row.id,
					map_id: row.map_id,
					week_start: String(row.week_start).slice(0, 10),
					week_code: row.week_code,
					credit_text: row.credit_text,
					payload,
					created_at: row.created_at,
					updated_at: row.updated_at
				}
			};
		});

	event.setHeaders({
		'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
	});

	return { maps: mapsWithRotations, tsushimaMaps };
};
