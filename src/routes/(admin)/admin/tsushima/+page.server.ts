import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getTsushimaWeekStart } from '$lib/dates';
import type { TsushimaMapRow, TsushimaWaveRow } from '$lib/types';
import {
	parseTsushimaWavesFromForm,
	validateAndBuildTsushimaRpcPayload
} from '$lib/server/tsushima-upsert';

function normalizeCreditText(value: FormDataEntryValue | null): string | null {
	const raw = typeof value === 'string' ? value.trim() : '';
	return raw || null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;
	const weekStartStr = getTsushimaWeekStart();

	const [mapsRes, rotRes] = await Promise.all([
		supabase.from('tsushima_maps').select('*').order('name'),
		supabase.from('tsushima_rotations').select('*').eq('week_start', weekStartStr)
	]);

	if (mapsRes.error) {
		console.error('[admin tsushima] maps', mapsRes.error);
	}
	if (rotRes.error) {
		console.error('[admin tsushima] rotations', rotRes.error);
	}

	const maps = (mapsRes.data ?? []) as TsushimaMapRow[];
	const existingRotations = rotRes.data ?? [];

	return {
		maps,
		weekStart: weekStartStr,
		existingRotations
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const supabase = locals.supabase;
		const formData = await request.formData();

		const map_id = formData.get('map_id') as string;
		const week_code = (formData.get('week_code') as string)?.trim() ?? '';
		const credit_text = normalizeCreditText(formData.get('credit_text'));
		const weekStart = getTsushimaWeekStart();

		if (!map_id) {
			return fail(400, { error: 'Map is required.' });
		}

		const { data: mapRow, error: mapErr } = await supabase
			.from('tsushima_maps')
			.select('*')
			.eq('id', map_id)
			.maybeSingle();

		if (mapErr || !mapRow) {
			return fail(400, { error: 'Map not found.' });
		}

		const map: TsushimaMapRow = {
			...mapRow,
			zones: mapRow.zones as TsushimaMapRow['zones'],
			week_options: mapRow.week_options as TsushimaMapRow['week_options'],
			objectives: mapRow.objectives,
			wave_modifiers: mapRow.wave_modifiers
		};

		const wavesParsed = parseTsushimaWavesFromForm(formData);
		if (!Array.isArray(wavesParsed)) {
			return fail(400, { error: wavesParsed.error });
		}

		const waves: TsushimaWaveRow[] = wavesParsed;

		const built = validateAndBuildTsushimaRpcPayload(
			map,
			weekStart,
			week_code,
			credit_text,
			waves
		);

		if (!built.ok) {
			return fail(400, { error: built.error });
		}

		const { data: rotation_id, error: rpcError } = await supabase.rpc('upsert_tsushima_rotation', {
			payload: built.payload
		});

		if (rpcError) {
			console.error('[admin tsushima] rpc', rpcError);
			return fail(500, { error: `Failed to save: ${rpcError.message}` });
		}

		return { success: true, savedMapId: map_id, rotation_id };
	}
};
