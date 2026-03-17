<script lang="ts">
	import {
		Table,
		TableHeader,
		TableBody,
		TableRow,
		TableHead,
		TableCell
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import type { RotationWithStages } from '$lib/types';

	let { rotation }: { rotation: RotationWithStages | null } = $props();

	function spawnColumns(stageNumber: number): number {
		return stageNumber === 4 ? 4 : 3;
	}
</script>

{#if !rotation}
	<p class="py-8 text-center text-muted-foreground">No rotation data yet for this week.</p>
{:else}
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead class="w-24">Round</TableHead>
				<TableHead>Spawn 1</TableHead>
				<TableHead>Spawn 2</TableHead>
				<TableHead>Spawn 3</TableHead>
				<TableHead>Spawn 4</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each rotation.stages as stage}
				<TableRow class="bg-muted/30">
					<TableCell colspan={1 + spawnColumns(stage.stage_number)} class="font-semibold">
						<span class="flex items-center gap-2">
							Stage {stage.stage_number}
							{#if stage.modifier}
								<Badge variant="secondary">{stage.modifier.name}</Badge>
							{/if}
						</span>
					</TableCell>
				</TableRow>
				{#each stage.rounds as round}
					<TableRow>
						<TableCell class="text-muted-foreground">Round {round.round_number}</TableCell>
						{#each round.spawns as spawn}
							<TableCell>
								{spawn.location}
								<span class="text-muted-foreground">({spawn.element})</span>
							</TableCell>
						{/each}
						<!-- Fill empty cells if fewer spawns than max -->
						{#each Array(spawnColumns(stage.stage_number) - round.spawns.length) as _}
							<TableCell></TableCell>
						{/each}
					</TableRow>
				{/each}
			{/each}
		</TableBody>
	</Table>
{/if}
