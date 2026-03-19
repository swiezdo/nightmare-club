<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { SegmentedControl } from '$lib/components/ui/segmented-control';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const elements = ['Sun', 'Moon', 'Storm'] as const;

	let selectedMapId = $state('');

	let selectedMap = $derived(data.maps?.find((m: any) => m.id === selectedMapId) ?? null);
	let locations = $derived(selectedMap?.locations ?? []);

	let existingRotation = $derived(
		data.existingRotations?.find((r: any) => r.map_id === selectedMapId) ?? null
	);

	function getExistingSpawn(roundNum: number, waveNum: number, spawnIdx: number) {
		if (!existingRotation) return null;
		const round = existingRotation.rounds?.find((r: any) => r.round_number === roundNum);
		if (!round) return null;
		const wave = round.waves?.find((w: any) => w.wave_number === waveNum);
		if (!wave) return null;
		return wave.spawns?.find((sp: any) => sp.spawn_index === spawnIdx) ?? null;
	}

	function getExistingModifier(roundNum: number): string {
		if (!existingRotation) return '';
		const round = existingRotation.rounds?.find((r: any) => r.round_number === roundNum);
		return round?.modifier_id ?? '';
	}

	const selectClass =
		'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
</script>

<div class="space-y-6">
	<h2 class="text-2xl font-bold">Edit Spawn Rotation</h2>

	{#if form?.success}
		<Alert class="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">
			<AlertDescription>Rotation saved successfully!</AlertDescription>
		</Alert>
	{/if}

	{#if form?.error}
		<Alert variant="destructive">
			<AlertDescription>{form.error}</AlertDescription>
		</Alert>
	{/if}

	<form method="POST" action="?/save" use:enhance class="space-y-8">
		<input type="hidden" name="week_start" value={data.weekStart} />

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div class="space-y-2">
				<label for="map_id" class="text-sm font-medium leading-none">Map</label>
				<select
					id="map_id"
					name="map_id"
					class={selectClass}
					bind:value={selectedMapId}
					required
				>
					<option value="" disabled>Select a map...</option>
					{#each data.maps as map}
						<option value={map.id}>{map.name}</option>
					{/each}
				</select>
			</div>

			<div class="space-y-2">
				<span class="text-sm font-medium leading-none">Week Start (Saturday)</span>
				<div class="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm">
					{data.weekStart}
				</div>
			</div>
		</div>

		{#each [1, 2, 3, 4] as roundNum}
			{@const waveCount = roundNum <= 3 ? 3 : 4}
			{@const spawnCount = roundNum <= 3 ? 3 : 4}
			<div class="rounded-lg border border-border p-4 space-y-4">
				<div class="flex items-center gap-4">
					<h3 class="text-lg font-semibold">Round {roundNum}</h3>
					<div class="flex-1">
						<select
							name={`round_${roundNum}_modifier`}
							class={selectClass}
						>
							<option value="">No Modifier</option>
							{#each data.modifiers as modifier}
								<option
									value={modifier.id}
									selected={getExistingModifier(roundNum) === modifier.id}
								>
									{modifier.name}
								</option>
							{/each}
						</select>
					</div>
				</div>

				{#each Array.from({ length: waveCount }, (_, i) => i + 1) as waveNum}
					<div class="space-y-2">
						<h4 class="text-sm font-medium text-muted-foreground">Wave {waveNum}</h4>
						<div class="grid gap-3 {spawnCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}">
							{#each Array.from({ length: spawnCount }, (_, i) => i + 1) as spawnIdx}
								{@const existing = getExistingSpawn(roundNum, waveNum, spawnIdx)}
								<div class="flex items-center gap-2 rounded-md border border-border/50 bg-card p-2">
									<span class="text-xs font-medium text-muted-foreground w-5">
										{spawnIdx}
									</span>
									<SegmentedControl
										options={locations}
										name={`round_${roundNum}_wave_${waveNum}_spawn_${spawnIdx}_location`}
										value={existing?.location ?? ''}
										required
									/>
									<SegmentedControl
										options={elements}
										name={`round_${roundNum}_wave_${waveNum}_spawn_${spawnIdx}_element`}
										value={existing?.element ?? ''}
										required
									/>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/each}

		<Button type="submit" class="w-full sm:w-auto">Save Rotation</Button>
	</form>
</div>
