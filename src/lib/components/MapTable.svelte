<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { RotationWithRounds } from '$lib/types';

	let { rotation }: { rotation: RotationWithRounds | null } = $props();
</script>

{#if !rotation}
	<p class="py-8 text-center text-muted-foreground">No rotation data yet for this week.</p>
{:else}
	<div class="rounded-xl border border-border bg-card p-3 space-y-1 sm:p-4">
		{#each rotation.rounds as round, i}
			{#if i > 0}
				<hr class="border-border" />
			{/if}
			<div class="py-2 space-y-2 sm:py-3 sm:space-y-3">
				<div class="flex items-center gap-2">
					<h3 class="text-base font-bold uppercase text-primary sm:text-lg">
						Round {round.round_number}
					</h3>
					{#if round.modifier}
						<Badge variant="secondary" class="text-xs">{round.modifier.name}</Badge>
					{/if}
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
					{#each round.waves as wave}
						<div class="flex gap-3 sm:block sm:space-y-1.5">
							<p class="shrink-0 w-8 text-sm font-semibold text-muted-foreground sm:w-auto">
								{round.round_number}-{wave.wave_number}
							</p>
							<div class="flex flex-wrap gap-x-4 gap-y-0.5 sm:block sm:space-y-1.5">
								{#each wave.spawns as spawn}
									<p class="text-sm uppercase">
										{spawn.location}
										<span class="text-muted-foreground">({spawn.element})</span>
									</p>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
