import { ATTUNEMENT_MAP_SLUGS, ATTUNEMENT_NAMES, ROUND_COUNT, ROUND_STRUCTURE } from '$lib/constants';
import {
	SPAWN_POINT_MAX_LENGTH,
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
import { getCurrentWeekStart } from '$lib/dates';
import type { UpsertRotationPayload } from '$lib/types';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type ChallengeRow = {
	id: string;
	name: string;
};

type MapRow = {
	id: string;
	slug: string;
	locations: string[];
};

export const PUT: RequestHandler = async ({ request }) => {
	const authError = requireBearerToken(request, env.BOT_API_TOKEN_YOTEI);
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

	const week_start = getCurrentWeekStart();

	const supabase = getAdminSupabase();
	const [mapResult, challengesResult] = await Promise.all([
		supabase.from('maps').select('id, slug, locations').eq('slug', map_slug).maybeSingle(),
		supabase.from('challenges').select('id, name')
	]);

	if (mapResult.error || !mapResult.data) {
		return fail(404, 'not_found', 'Unknown Yotei map slug.', [
			{ path: 'map_slug', message: `No map exists for slug "${map_slug}".` }
		]);
	}

	if (challengesResult.error || !challengesResult.data) {
		console.error('[bot api] failed to load yotei challenge metadata', challengesResult.error);
		return fail(500, 'internal_error', 'Failed to load challenge metadata.');
	}

	const validation = validateYoteiPayload(body, mapResult.data, challengesResult.data, week_start);
	if (!validation.valid) {
		return fail(400, 'validation_error', 'Payload validation failed.', validation.details);
	}

	const { data: rotationId, error: rpcError } = await supabase.rpc('upsert_rotation', {
		payload: validation.payload
	});

	if (rpcError || !rotationId) {
		console.error('[bot api] failed to persist yotei rotation', rpcError);
		return fail(500, 'internal_error', 'Failed to persist Yotei rotation.');
	}

	return ok({
		game: 'yotei',
		rotation_id: rotationId,
		week_start,
		map_slug,
		updated: true
	});
};

function validateYoteiPayload(
	body: unknown,
	map: MapRow,
	challenges: ChallengeRow[],
	weekStart: string
):
	| { valid: true; payload: UpsertRotationPayload }
	| { valid: false; details: ApiErrorDetail[] } {
	const details: ApiErrorDetail[] = [];

	if (!isPlainObject(body)) {
		return {
			valid: false,
			details: [{ path: '', message: 'Request body must be a JSON object.' }]
		};
	}

	collectUnexpectedKeys(body, ['map_slug', 'credit_text', 'challenges', 'rounds'], '', details);

	const creditText = normalizeCreditText(body.credit_text, 'credit_text', details);
	const challengeLookup = new Map(challenges.map((challenge) => [challenge.name, challenge.id]));

	const challengeItems = validateChallenges(body.challenges, challengeLookup, details);
	const roundItems = validateRounds(body.rounds, map, details);

	if (details.length > 0 || !challengeItems || !roundItems) {
		return { valid: false, details };
	}

	return {
		valid: true,
		payload: {
			map_id: map.id,
			week_start: weekStart,
			credit_text: creditText,
			challenges: challengeItems,
			rounds: roundItems
		}
	};
}

function validateChallenges(
	value: unknown,
	challengeLookup: Map<string, string>,
	details: ApiErrorDetail[]
) {
	if (value === undefined) return [];
	if (!Array.isArray(value)) {
		details.push({ path: 'challenges', message: 'Expected an array.' });
		return null;
	}

	const result: UpsertRotationPayload['challenges'] = [];
	const seenRounds = new Set<number>();

	for (let index = 0; index < value.length; index += 1) {
		const item = value[index];
		const path = `challenges[${index}]`;
		if (!isPlainObject(item)) {
			details.push({ path, message: 'Expected an object.' });
			continue;
		}

		collectUnexpectedKeys(item, ['round', 'slug'], path, details);

		const round = item.round;
		if (!Number.isInteger(round) || round < 1 || round > ROUND_COUNT) {
			details.push({ path: `${path}.round`, message: `Expected an integer between 1 and ${ROUND_COUNT}.` });
		} else if (seenRounds.has(round)) {
			details.push({ path: `${path}.round`, message: 'Duplicate challenge round.' });
		} else {
			seenRounds.add(round);
		}

		if (typeof item.slug !== 'string' || !item.slug.trim()) {
			details.push({ path: `${path}.slug`, message: 'Expected a non-empty challenge slug.' });
			continue;
		}

		const challengeId = challengeLookup.get(item.slug.trim());
		if (!challengeId) {
			details.push({ path: `${path}.slug`, message: `Unknown challenge slug "${item.slug}".` });
			continue;
		}

		if (Number.isInteger(round) && round >= 1 && round <= ROUND_COUNT) {
			result.push({ challenge_id: challengeId, round_number: round });
		}
	}

	return result;
}

function validateRounds(value: unknown, map: MapRow, details: ApiErrorDetail[]) {
	if (!Array.isArray(value)) {
		details.push({ path: 'rounds', message: 'Expected an array.' });
		return null;
	}

	if (value.length !== ROUND_COUNT) {
		details.push({ path: 'rounds', message: `Expected exactly ${ROUND_COUNT} rounds.` });
	}

	const result: UpsertRotationPayload['rounds'] = [];
	const hasAttunements = ATTUNEMENT_MAP_SLUGS.has(map.slug);
	const allowedLocations = new Set(map.locations);

	for (let roundIndex = 0; roundIndex < value.length; roundIndex += 1) {
		const item = value[roundIndex];
		const path = `rounds[${roundIndex}]`;
		if (!isPlainObject(item)) {
			details.push({ path, message: 'Expected an object.' });
			continue;
		}

		collectUnexpectedKeys(item, ['round', 'waves'], path, details);

		const expectedRound = roundIndex + 1;
		if (item.round !== expectedRound) {
			details.push({ path: `${path}.round`, message: `Expected round number ${expectedRound}.` });
		}

		const structure = ROUND_STRUCTURE[expectedRound as keyof typeof ROUND_STRUCTURE];
		if (!Array.isArray(item.waves)) {
			details.push({ path: `${path}.waves`, message: 'Expected an array.' });
			continue;
		}

		if (item.waves.length !== structure.waves) {
			details.push({
				path: `${path}.waves`,
				message: `Expected exactly ${structure.waves} waves for round ${expectedRound}.`
			});
		}

		const waves: UpsertRotationPayload['rounds'][number]['waves'] = [];

		for (let waveIndex = 0; waveIndex < item.waves.length; waveIndex += 1) {
			const wave = item.waves[waveIndex];
			const wavePath = `${path}.waves[${waveIndex}]`;
			if (!isPlainObject(wave)) {
				details.push({ path: wavePath, message: 'Expected an object.' });
				continue;
			}

			collectUnexpectedKeys(wave, ['wave', 'spawns'], wavePath, details);

			const expectedWave = waveIndex + 1;
			if (wave.wave !== expectedWave) {
				details.push({ path: `${wavePath}.wave`, message: `Expected wave number ${expectedWave}.` });
			}

			if (!Array.isArray(wave.spawns)) {
				details.push({ path: `${wavePath}.spawns`, message: 'Expected an array.' });
				continue;
			}

			if (wave.spawns.length !== structure.spawns) {
				details.push({
					path: `${wavePath}.spawns`,
					message: `Expected exactly ${structure.spawns} spawns for round ${expectedRound} wave ${expectedWave}.`
				});
			}

			const spawns: UpsertRotationPayload['rounds'][number]['waves'][number]['spawns'] = [];

			for (let spawnIndex = 0; spawnIndex < wave.spawns.length; spawnIndex += 1) {
				const spawn = wave.spawns[spawnIndex];
				const spawnPath = `${wavePath}.spawns[${spawnIndex}]`;
				if (!isPlainObject(spawn)) {
					details.push({ path: spawnPath, message: 'Expected an object.' });
					continue;
				}

				collectUnexpectedKeys(
					spawn,
					['order', 'location', 'spawn_point', 'attunements'],
					spawnPath,
					details
				);

				const expectedOrder = spawnIndex + 1;
				if (spawn.order !== expectedOrder) {
					details.push({
						path: `${spawnPath}.order`,
						message: `Expected spawn order ${expectedOrder}.`
					});
				}

				if (typeof spawn.location !== 'string' || !allowedLocations.has(spawn.location)) {
					details.push({
						path: `${spawnPath}.location`,
						message: `Expected one of: ${map.locations.join(', ')}.`
					});
				}

				const spawnPoint = normalizeSpawnPoint(spawn.spawn_point, `${spawnPath}.spawn_point`, details);
				const attunements = normalizeAttunements(
					spawn.attunements,
					`${spawnPath}.attunements`,
					hasAttunements,
					details
				);

				if (typeof spawn.location === 'string' && attunements) {
					spawns.push({
						spawn_order: expectedOrder,
						location: spawn.location,
						spawn_point: spawnPoint,
						element: attunements
					});
				}
			}

			waves.push({ wave_number: expectedWave, spawns });
		}

		result.push({ round_number: expectedRound, waves });
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

function normalizeSpawnPoint(value: unknown, path: string, details: ApiErrorDetail[]) {
	if (value === undefined || value === null || value === '') return null;
	if (typeof value !== 'string') {
		details.push({ path, message: 'Expected a string or null.' });
		return null;
	}

	const trimmed = value.trim();
	if (trimmed.length > SPAWN_POINT_MAX_LENGTH) {
		details.push({
			path,
			message: `Spawn point must be ${SPAWN_POINT_MAX_LENGTH} characters or fewer.`
		});
	}

	return trimmed ? trimmed.slice(0, SPAWN_POINT_MAX_LENGTH) : null;
}

function normalizeAttunements(
	value: unknown,
	path: string,
	required: boolean,
	details: ApiErrorDetail[]
) {
	if (!required) {
		if (value !== undefined && Array.isArray(value) && value.length > 0) {
			details.push({ path, message: 'Attunements are only allowed for Hidden Temple.' });
		}
		return [];
	}

	if (!Array.isArray(value)) {
		details.push({ path, message: 'Expected an array with 1 or 2 attunements.' });
		return null;
	}

	if (value.length < 1 || value.length > 2) {
		details.push({ path, message: 'Expected 1 or 2 attunements.' });
	}

	const allowed = new Set(ATTUNEMENT_NAMES);
	const attunements: string[] = [];
	for (let index = 0; index < value.length; index += 1) {
		const entry = value[index];
		if (typeof entry !== 'string' || !allowed.has(entry as (typeof ATTUNEMENT_NAMES)[number])) {
			details.push({
				path: `${path}[${index}]`,
				message: `Expected one of: ${ATTUNEMENT_NAMES.join(', ')}.`
			});
			continue;
		}

		attunements.push(entry);
	}

	return attunements;
}

export const POST: RequestHandler = async (event) => PUT(event);

export const GET: RequestHandler = async () =>
	json(
		{
			ok: true,
			game: 'yotei',
			method: 'PUT',
			path: '/api/rotations/yotei'
		},
		{ status: 200 }
	);
