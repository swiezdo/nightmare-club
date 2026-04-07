import {
	collectUnexpectedKeys,
	fail,
	getAdminSupabase,
	isPlainObject,
	normalizeOptionalString,
	ok,
	readJsonBody,
	requireBearerToken,
	requireJsonRequest,
	type ApiErrorDetail
} from '$lib/server/bot-api';
import { getTsushimaWeekStart } from '$lib/dates';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type TsushimaZone = {
	zone: string;
	spawns: string[];
};

type TsushimaWeekOption = {
	code: string;
	modifiers: { slot: number; name: string; icon: string }[];
};

type TsushimaMapRow = {
	id: string;
	slug: string;
	name: string;
	zones: TsushimaZone[];
	week_options: TsushimaWeekOption[];
	objectives: unknown;
	wave_modifiers: unknown;
};

const TSUSHIMA_WAVE_COUNT = 15;
const TSUSHIMA_SPAWN_COUNT = 3;

export const PUT: RequestHandler = async ({ request }) => {
	const authError = requireBearerToken(request, env.BOT_API_TOKEN_TSUSHIMA);
	if (authError) return authError;

	const contentTypeError = requireJsonRequest(request);
	if (contentTypeError) return contentTypeError;

	const { data: body, error: bodyError } = await readJsonBody(request);
	if (bodyError) return bodyError;

	if (!isPlainObject(body)) {
		return fail(400, 'validation_error', 'Request body must be a JSON object.', [
			{ path: '', message: 'Expected a JSON object.' }
		]);
	}

	const map_slug = typeof body.map_slug === 'string' ? body.map_slug.trim() : '';
	if (!map_slug) {
		return fail(400, 'validation_error', 'Payload validation failed.', [
			{ path: 'map_slug', message: 'Expected a non-empty map_slug string.' }
		]);
	}

	const week_start = getTsushimaWeekStart();

	const supabase = getAdminSupabase();
	const { data: map, error: mapError } = await supabase
		.from('tsushima_maps')
		.select('id, slug, name, zones, week_options, objectives, wave_modifiers')
		.eq('slug', map_slug)
		.maybeSingle();

	if (mapError || !map) {
		return fail(404, 'not_found', 'Unknown Tsushima map slug.', [
			{ path: 'map_slug', message: `No Tsushima map exists for slug "${map_slug}".` }
		]);
	}

	const validation = validateTsushimaPayload(body, map, week_start);
	if (!validation.valid) {
		return fail(400, 'validation_error', 'Payload validation failed.', validation.details);
	}

	const { data: rotationId, error: rpcError } = await supabase.rpc(
		'upsert_tsushima_rotation',
		{ payload: validation.payload } as never
	);

	if (rpcError || !rotationId) {
		console.error('[bot api] failed to persist tsushima rotation', rpcError);
		return fail(500, 'internal_error', 'Failed to persist Tsushima rotation.');
	}

	return ok({
		game: 'tsushima',
		rotation_id: rotationId,
		week_start,
		map_slug,
		updated: true
	});
};

function validateTsushimaPayload(
	body: unknown,
	map: TsushimaMapRow,
	weekStart: string
):
	| { valid: true; payload: Record<string, unknown> }
	| { valid: false; details: ApiErrorDetail[] } {
	const details: ApiErrorDetail[] = [];

	if (!isPlainObject(body)) {
		return {
			valid: false,
			details: [{ path: '', message: 'Request body must be a JSON object.' }]
		};
	}

	collectUnexpectedKeys(body, ['map_slug', 'credit_text', 'week_code', 'waves'], '', details);

	const creditText = normalizeCreditText(body.credit_text, 'credit_text', details);
	const weekCode = typeof body.week_code === 'string' ? body.week_code.trim() : '';
	if (!weekCode) {
		details.push({ path: 'week_code', message: 'Expected a non-empty week code.' });
	}

	const weekOption = map.week_options.find((option) => option.code === weekCode);
	if (weekCode && !weekOption) {
		details.push({
			path: 'week_code',
			message: `Expected one of: ${map.week_options.map((option) => option.code).join(', ')}.`
		});
	}

	const waves = validateTsushimaWaves(body.waves, map, details);

	if (details.length > 0 || !weekOption || !waves) {
		return { valid: false, details };
	}

	return {
		valid: true,
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
				waves
			}
		}
	};
}

function validateTsushimaWaves(
	value: unknown,
	map: TsushimaMapRow,
	details: ApiErrorDetail[]
) {
	if (!Array.isArray(value)) {
		details.push({ path: 'waves', message: 'Expected an array.' });
		return null;
	}

	if (value.length !== TSUSHIMA_WAVE_COUNT) {
		details.push({
			path: 'waves',
			message: `Expected exactly ${TSUSHIMA_WAVE_COUNT} waves.`
		});
	}

	const zoneLookup = new Map(
		map.zones.map((zone) => [zone.zone, new Set(zone.spawns)])
	);

	const result: Array<{
		wave: number;
		spawns: Array<{ order: number; zone: string; spawn: string }>;
	}> = [];

	for (let waveIndex = 0; waveIndex < value.length; waveIndex += 1) {
		const item = value[waveIndex];
		const path = `waves[${waveIndex}]`;
		if (!isPlainObject(item)) {
			details.push({ path, message: 'Expected an object.' });
			continue;
		}

		collectUnexpectedKeys(item, ['wave', 'spawns'], path, details);

		const expectedWave = waveIndex + 1;
		if (item.wave !== expectedWave) {
			details.push({ path: `${path}.wave`, message: `Expected wave number ${expectedWave}.` });
		}

		if (!Array.isArray(item.spawns)) {
			details.push({ path: `${path}.spawns`, message: 'Expected an array.' });
			continue;
		}

		if (item.spawns.length !== TSUSHIMA_SPAWN_COUNT) {
			details.push({
				path: `${path}.spawns`,
				message: `Expected exactly ${TSUSHIMA_SPAWN_COUNT} spawns per wave.`
			});
		}

		const spawns: Array<{ order: number; zone: string; spawn: string }> = [];

		for (let spawnIndex = 0; spawnIndex < item.spawns.length; spawnIndex += 1) {
			const spawn = item.spawns[spawnIndex];
			const spawnPath = `${path}.spawns[${spawnIndex}]`;
			if (!isPlainObject(spawn)) {
				details.push({ path: spawnPath, message: 'Expected an object.' });
				continue;
			}

			collectUnexpectedKeys(spawn, ['order', 'zone', 'spawn'], spawnPath, details);

			const expectedOrder = spawnIndex + 1;
			if (spawn.order !== expectedOrder) {
				details.push({
					path: `${spawnPath}.order`,
					message: `Expected spawn order ${expectedOrder}.`
				});
			}

			if (typeof spawn.zone !== 'string' || !zoneLookup.has(spawn.zone)) {
				details.push({
					path: `${spawnPath}.zone`,
					message: `Expected one of: ${map.zones.map((zone) => zone.zone).join(', ')}.`
				});
				continue;
			}

			const allowedSpawns = zoneLookup.get(spawn.zone)!;
			if (typeof spawn.spawn !== 'string' || !allowedSpawns.has(spawn.spawn)) {
				details.push({
					path: `${spawnPath}.spawn`,
					message: `Expected one of: ${Array.from(allowedSpawns).join(', ')}.`
				});
				continue;
			}

			spawns.push({ order: expectedOrder, zone: spawn.zone, spawn: spawn.spawn });
		}

		result.push({ wave: expectedWave, spawns });
	}

	return result;
}

function normalizeCreditText(value: unknown, path: string, details: ApiErrorDetail[]) {
	if (value === undefined || value === null) return null;
	if (typeof value !== 'string') {
		details.push({ path, message: 'Expected a string or null.' });
		return null;
	}

	return normalizeOptionalString(value);
}

export const POST: RequestHandler = async (event) => PUT(event);

export const GET: RequestHandler = async () =>
	json(
		{
			ok: true,
			game: 'tsushima',
			method: 'PUT',
			path: '/api/rotations/tsushima'
		},
		{ status: 200 }
	);
