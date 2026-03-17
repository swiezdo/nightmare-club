<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const locations = ['Pagoda', 'Cemetery', 'Courtyard'] as const;
	const elements = ['Sun', 'Moon', 'Storm'] as const;

	let selectedMapId = $state('');

	let existingRotation = $derived(
		data.existingRotations?.find((r: any) => r.map_id === selectedMapId) ?? null
	);

	function getExistingSpawn(stageNum: number, roundNum: number, spawnIdx: number) {
		if (!existingRotation) return null;
		const stage = existingRotation.stages?.find((s: any) => s.stage_number === stageNum);
		if (!stage) return null;
		const round = stage.rounds?.find((r: any) => r.round_number === roundNum);
		if (!round) return null;
		return round.spawns?.find((sp: any) => sp.spawn_index === spawnIdx) ?? null;
	}

	function getExistingModifier(stageNum: number): string {
		if (!existingRotation) return '';
		const stage = existingRotation.stages?.find((s: any) => s.stage_number === stageNum);
		return stage?.modifier_id ?? '';
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

		{#each [1, 2, 3, 4] as stageNum}
			{@const spawnCount = stageNum <= 3 ? 3 : 4}
			<div class="rounded-lg border border-border p-4 space-y-4">
				<div class="flex items-center gap-4">
					<h3 class="text-lg font-semibold">Stage {stageNum}</h3>
					<div class="flex-1">
						<select
							name={`stage_${stageNum}_modifier`}
							class={selectClass}
						>
							<option value="">No Modifier</option>
							{#each data.modifiers as modifier}
								<option
									value={modifier.id}
									selected={getExistingModifier(stageNum) === modifier.id}
								>
									{modifier.name}
								</option>
							{/each}
						</select>
					</div>
				</div>

				{#each [1, 2, 3] as roundNum}
					<div class="space-y-2">
						<h4 class="text-sm font-medium text-muted-foreground">Round {roundNum}</h4>
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-{spawnCount}">
							{#each Array.from({ length: spawnCount }, (_, i) => i + 1) as spawnIdx}
								{@const existing = getExistingSpawn(stageNum, roundNum, spawnIdx)}
								<div class="flex items-center gap-2 rounded-md border border-border/50 bg-card p-2">
									<span class="text-xs font-medium text-muted-foreground w-5">
										{spawnIdx}
									</span>
									<select
										name={`stage_${stageNum}_round_${roundNum}_spawn_${spawnIdx}_location`}
										class={selectClass}
										required
									>
										<option value="" disabled selected={!existing}>Location</option>
										{#each locations as loc}
											<option value={loc} selected={existing?.location === loc}>
												{loc}
											</option>
										{/each}
									</select>
									<select
										name={`stage_${stageNum}_round_${roundNum}_spawn_${spawnIdx}_element`}
										class={selectClass}
										required
									>
										<option value="" disabled selected={!existing}>Element</option>
										{#each elements as el}
											<option value={el} selected={existing?.element === el}>
												{el}
											</option>
										{/each}
									</select>
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
