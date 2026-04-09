import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTsushimaWeekStart } from '$lib/dates';
import { requireBearerToken } from '$lib/server/bot-api';
import { env } from '$env/dynamic/private';
import type { TsushimaPayloadJson, TsushimaWaveRow } from '$lib/types';

function wavesFromPayload(raw: unknown): TsushimaWaveRow[] {
	if (!raw || typeof raw !== 'object' || !('waves' in raw)) return [];
	const w = (raw as TsushimaPayloadJson).waves;
	if (!Array.isArray(w)) return [];
	return w as TsushimaWaveRow[];
}

export const GET: RequestHandler = async ({ request, locals }) => {
	const authError = requireBearerToken(request, env.BOT_API_TOKEN_TSUSHIMA);
	if (authError) return authError;

	const weekStartStr = getTsushimaWeekStart();
	const [rotationsResult, mapsResult] = await Promise.all([
		locals.supabase
			.from('tsushima_rotations')
			.select('map_id, week_code, credit_text, payload')
			.eq('week_start', weekStartStr),
		locals.supabase.from('tsushima_maps').select('id, slug')
	]);

	if (rotationsResult.error) {
		console.error('[api/rotation/tsushima] rotations', rotationsResult.error);
		return json({ error: 'Failed to fetch rotations' }, { status: 500 });
	}

	if (mapsResult.error) {
		console.error('[api/rotation/tsushima] maps', mapsResult.error);
		return json({ error: 'Failed to fetch map metadata' }, { status: 500 });
	}

	const slugByMapId = new Map((mapsResult.data ?? []).map((map) => [map.id, map.slug]));
	const maps = (rotationsResult.data ?? []).map((row) => {
		const payload = row.payload as unknown;
		const mapSlug = slugByMapId.get(row.map_id) ?? '';
		return {
			week_code: row.week_code,
			map_slug: mapSlug,
			credit_text: row.credit_text ?? null,
			waves: wavesFromPayload(payload)
		};
	});

	return json(
		{ maps },
		{
			headers: {
				'Cache-Control': 'private, no-store'
			}
		}
	);
};
