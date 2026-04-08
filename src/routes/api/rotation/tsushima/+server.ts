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

function mapMetaFromPayload(raw: unknown): { map_slug: string; credit_text: string | null } {
	if (!raw || typeof raw !== 'object') return { map_slug: '', credit_text: null };
	const p = raw as TsushimaPayloadJson;
	const slug =
		p.map && typeof p.map === 'object' && 'slug' in p.map
			? String((p.map as { slug?: string }).slug ?? '').trim()
			: '';
	return { map_slug: slug, credit_text: p.credit_text ?? null };
}

export const GET: RequestHandler = async ({ request, locals }) => {
	const authError = requireBearerToken(request, env.BOT_API_TOKEN_TSUSHIMA);
	if (authError) return authError;

	const weekStartStr = getTsushimaWeekStart();
	const { data: rows, error } = await locals.supabase
		.from('tsushima_rotations')
		.select('week_code, payload')
		.eq('week_start', weekStartStr);

	if (error) {
		console.error('[api/rotation/tsushima]', error);
		return json({ error: 'Failed to fetch rotations' }, { status: 500 });
	}

	const maps = (rows ?? []).map((row) => {
		const payload = row.payload as unknown;
		const meta = mapMetaFromPayload(payload);
		return {
			week_code: row.week_code,
			map_slug: meta.map_slug,
			credit_text: meta.credit_text,
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
