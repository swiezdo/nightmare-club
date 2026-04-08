import type {
	TsushimaMapRow,
	TsushimaWaveRow,
	TsushimaWaveSpawn
} from '$lib/types';

const WAVE_COUNT = 15;
const SPAWN_COUNT = 3;

export function validateAndBuildTsushimaRpcPayload(
	map: TsushimaMapRow,
	weekStart: string,
	weekCodeRaw: string,
	creditText: string | null,
	waves: TsushimaWaveRow[]
): { ok: true; payload: Record<string, unknown> } | { ok: false; error: string } {
	const weekCode = weekCodeRaw.trim();
	if (!weekCode) {
		return { ok: false, error: 'Week code is required.' };
	}

	const weekOption = map.week_options.find((o) => o.code === weekCode);
	if (!weekOption) {
		return {
			ok: false,
			error: `Invalid week code. Expected one of: ${map.week_options.map((o) => o.code).join(', ')}.`
		};
	}

	if (waves.length !== WAVE_COUNT) {
		return { ok: false, error: `Expected exactly ${WAVE_COUNT} waves.` };
	}

	const zoneLookup = new Map(map.zones.map((z) => [z.zone, new Set(z.spawns)]));

	const normalizedWaves: TsushimaWaveRow[] = [];

	for (let wi = 0; wi < WAVE_COUNT; wi++) {
		const wave = waves[wi];
		if (wave.wave !== wi + 1) {
			return { ok: false, error: `Wave ${wi + 1}: invalid wave number.` };
		}
		if (!wave.spawns || wave.spawns.length !== SPAWN_COUNT) {
			return { ok: false, error: `Wave ${wave.wave}: expected ${SPAWN_COUNT} spawns.` };
		}
		const normSpawns: TsushimaWaveSpawn[] = [];
		for (let si = 0; si < SPAWN_COUNT; si++) {
			const sp = wave.spawns[si];
			if (sp.order !== si + 1) {
				return { ok: false, error: `Wave ${wave.wave}: invalid spawn order.` };
			}
			const zoneRaw = (sp.zone ?? '').trim();
			const spawnRaw = (sp.spawn ?? '').trim();

			if (!zoneRaw) {
				if (spawnRaw) {
					return {
						ok: false,
						error: `Wave ${wave.wave}: spawn without zone in slot ${si + 1}.`
					};
				}
				normSpawns.push({ order: si + 1, zone: '', spawn: '' });
				continue;
			}

			if (!zoneLookup.has(zoneRaw)) {
				return {
					ok: false,
					error: `Wave ${wave.wave}: unknown zone "${zoneRaw}".`
				};
			}
			const allowed = zoneLookup.get(zoneRaw)!;
			if (!spawnRaw) {
				normSpawns.push({ order: si + 1, zone: zoneRaw, spawn: '' });
				continue;
			}
			if (!allowed.has(spawnRaw)) {
				return {
					ok: false,
					error: `Wave ${wave.wave}: spawn "${spawnRaw}" is not valid for zone "${zoneRaw}".`
				};
			}
			normSpawns.push({ order: si + 1, zone: zoneRaw, spawn: spawnRaw });
		}
		normalizedWaves.push({ wave: wave.wave, spawns: normSpawns });
	}

	return {
		ok: true,
		payload: {
			map_id: map.id,
			week_start: weekStart,
			week_code: weekOption.code,
			credit_text: creditText,
			payload: {
				map: { slug: map.slug, name: map.name },
				week_start: weekStart,
				week_code: weekOption.code,
				credit_text: creditText,
				weekly_modifiers: weekOption.modifiers,
				bonus_objectives: map.objectives,
				wave_modifiers: map.wave_modifiers,
				waves: normalizedWaves
			}
		}
	};
}

export function parseTsushimaWavesFromForm(
	formData: FormData
): TsushimaWaveRow[] | { error: string } {
	const waves: TsushimaWaveRow[] = [];
	for (let w = 1; w <= WAVE_COUNT; w++) {
		const spawns: TsushimaWaveSpawn[] = [];
		for (let s = 1; s <= SPAWN_COUNT; s++) {
			const raw = (formData.get(`wave_${w}_spawn_${s}`) as string) ?? '';
			const trimmed = raw.trim();
			if (trimmed === '') {
				spawns.push({ order: s, zone: '', spawn: '' });
				continue;
			}
			const tab = '\t';
			const i = raw.indexOf(tab);
			if (i < 0) {
				return {
					error: `Invalid spawn selection for wave ${w}, slot ${s}.`
				};
			}
			const zone = raw.slice(0, i).trim();
			const spawn = raw.slice(i + 1).trim();
			if (!zone) {
				if (spawn) {
					return {
						error: `Invalid spawn selection for wave ${w}, slot ${s} (spawn without zone).`
					};
				}
				spawns.push({ order: s, zone: '', spawn: '' });
				continue;
			}
			spawns.push({ order: s, zone, spawn });
		}
		waves.push({ wave: w, spawns });
	}
	return waves;
}
