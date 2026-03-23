<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { ATTUNEMENTS, ATTUNEMENT_MAP_SLUGS } from '$lib/constants';
	import type { RotationWithRounds } from '$lib/types';

	let { rotation, mapSlug = '' }: { rotation: RotationWithRounds | null; mapSlug?: string } = $props();

	const hasAttunements = $derived(ATTUNEMENT_MAP_SLUGS.has(mapSlug));

	function attunementColor(name: string): string {
		return ATTUNEMENTS[name as keyof typeof ATTUNEMENTS] ?? '#888';
	}
</script>

{#if !rotation}
	<p class="py-8 text-center text-muted-foreground">No rotation data yet for this week.</p>
{:else}
	<div class="space-y-3">
		{#each rotation.rounds as round}
			<div class="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
				<div class="border-b border-gray-700 bg-gray-900 px-3 py-1.5">
					<div class="flex items-center gap-2">
						<h3 class="text-sm font-bold uppercase tracking-wide text-gray-200">
							Stage {round.round_number}
						</h3>
						{#if round.challenge}
							<Badge variant="destructive" class="text-xs uppercase">Challenge</Badge>
							<span class="text-sm font-medium text-gray-100">{round.challenge.description}</span>
						{/if}
					</div>
				</div>

				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700 text-xs text-gray-400">
							<th class="hidden sm:table-cell w-12 px-2 py-1 text-left font-medium">Wave</th>
							{#each round.waves[0]?.spawns ?? [] as _, i}
								<th class="px-1 sm:px-2 py-1 text-center font-medium {(i + 1) % 2 === 0 ? 'bg-gray-700/50' : ''}">Spawn {i + 1}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each round.waves as wave, wi}
							<tr class="border-b border-gray-700/50 last:border-0">
								<td class="hidden sm:table-cell px-2 py-3 font-mono text-xs font-semibold text-gray-400">
									{wave.wave_number}
								</td>
								{#each wave.spawns as spawn, si}
									{@const atts = spawn.element ?? []}
									<td class="px-1 sm:px-2 py-3 text-center {(si + 1) % 2 === 0 ? 'bg-gray-700/50' : ''}">
										{#if hasAttunements && atts.length === 1}
											<span
												class="inline-block rounded-full px-2 sm:px-3.5 py-1 text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
												style="background-color: {attunementColor(atts[0])}"
												title={atts[0]}
											>{spawn.location}</span>
										{:else if hasAttunements && atts.length >= 2}
											<span
												class="inline-block rounded-full px-2 sm:px-3.5 py-1 text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
												style="background: linear-gradient(to right, {attunementColor(atts[0])} 50%, {attunementColor(atts[1])} 50%)"
												title="{atts[0]} / {atts[1]}"
											>{spawn.location}</span>
										{:else}
											<span class="font-medium text-gray-100">{spawn.location}</span>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
	</div>
{/if}
