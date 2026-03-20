<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { RotationWithRounds } from '$lib/types';

	let { rotation, mapSlug = '' }: { rotation: RotationWithRounds | null; mapSlug?: string } = $props();

	const hasAttunements = $derived(mapSlug === 'hidden-temple');

	const attunementColors: Record<string, string> = {
		Sun: '#e07722',
		Moon: '#6289f5',
		Storm: '#47d12c'
	};

	function attunementStyle(attunements: string[]): string {
		if (!attunements || attunements.length === 0) return '';
		if (attunements.length === 1) {
			const color = attunementColors[attunements[0]] ?? '#888';
			return `border-left: 3px solid ${color};padding-left: 0.5rem;`;
		}
		const c1 = attunementColors[attunements[0]] ?? '#888';
		const c2 = attunementColors[attunements[1]] ?? '#888';
		return `border-left: 3px solid ${c1};border-right: 3px solid ${c2};padding-left: 0.5rem;padding-right: 0.5rem;`;
	}

	function formatAttunements(attunements: string[]): string {
		if (!attunements || attunements.length === 0) return '';
		return attunements.join(', ');
	}
</script>

{#if !rotation}
	<p class="py-8 text-center text-muted-foreground">No rotation data yet for this week.</p>
{:else}
	<div class="rounded-xl border border-border bg-card p-3 space-y-1 sm:p-4">
		{#if rotation.challenge}
			<div class="mb-2 flex items-center gap-2">
				<Badge variant="destructive" class="text-xs uppercase">Challenge</Badge>
				<span class="text-sm font-medium">{rotation.challenge.name}</span>
				{#if rotation.challenge.description}
					<span class="text-xs text-muted-foreground">— {rotation.challenge.description}</span>
				{/if}
			</div>
		{/if}

		{#each rotation.rounds as round, i}
			{#if i > 0}
				<hr class="border-border" />
			{/if}
			<div class="py-2 space-y-2 sm:py-3 sm:space-y-3">
				<div class="flex items-center gap-2">
					<h3 class="text-base font-bold uppercase text-primary sm:text-lg">
						Stage {round.round_number}
					</h3>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
					{#each round.waves as wave}
						<div class="flex gap-3 sm:block sm:space-y-1.5">
							<p class="shrink-0 w-8 text-sm font-semibold text-muted-foreground sm:w-auto">
								{round.round_number}-{wave.wave_number}
							</p>
							<div class="flex flex-wrap gap-x-4 gap-y-0.5 sm:block sm:space-y-1.5">
								{#each wave.spawns as spawn}
									{@const atts = spawn.element ?? []}
									<p class="text-sm uppercase rounded" style={hasAttunements ? attunementStyle(atts) : ''}>
										{spawn.location}
										{#if hasAttunements && atts.length > 0}
											<span class="text-muted-foreground">({formatAttunements(atts)})</span>
										{/if}
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
