<script lang="ts">
    import { ATTUNEMENTS, ATTUNEMENT_MAP_SLUGS } from "$lib/constants";
    import type { RotationWithRounds } from "$lib/types";

    let {
        rotation,
        mapSlug = "",
    }: { rotation: RotationWithRounds | null; mapSlug?: string } = $props();

    const hasAttunements = $derived(ATTUNEMENT_MAP_SLUGS.has(mapSlug));

    function attunementColor(name: string): string {
        return ATTUNEMENTS[name as keyof typeof ATTUNEMENTS] ?? "#888";
    }
</script>

{#if !rotation}
    <p class="py-8 text-center text-muted-foreground">
        No rotation data yet for this week.
    </p>
{:else}
    <div class="space-y-5">
        {#each rotation.rounds as round}
            <div
                class="map-table-stage overflow-hidden rounded-lg border"
            >
                <div class="map-table-stage-header border-b px-3 py-3">
                    <div class="flex items-center justify-between">
                        <h3
                            class="map-table-stage-title text-sm font-bold uppercase tracking-wide"
                        >
                            Stage {round.round_number}
                        </h3>
                        {#if round.challenge}
                            <span class="map-table-note text-sm font-medium"
                                >{round.challenge.description}</span
                            >
                        {/if}
                    </div>
                </div>

                <table class="w-full table-fixed text-sm">
                    <thead>
                        <tr
                            class="map-table-header-row border-b text-xs"
                        >
                            <th
                                class="px-1 sm:table-cell w-12 sm:px-2 py-1 text-left font-medium"
                                >Wave</th
                            >
                            {#each round.waves[0]?.spawns ?? [] as _, i}
                                <th
                                    class="px-1 sm:px-2 py-1 text-center font-medium {(i +
                                        1) %
                                        2 ===
                                    0
                                        ? 'map-table-column-alt'
                                        : ''}">Spawn {i + 1}</th
                                >
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each round.waves as wave, wi}
                            <tr
                                class="map-table-row border-b last:border-0"
                            >
                                <td
                                    class="map-table-wave sm:table-cell px-1 sm:px-2 py-3 font-mono text-xs font-semibold"
                                >
                                    {wave.wave_number}
                                </td>
                                {#each wave.spawns as spawn, si}
                                    {@const atts = spawn.element ?? []}
                                    <td
                                        class="px-1 sm:px-2 py-3 text-center {(si +
                                            1) %
                                            2 ===
                                        0
                                            ? 'map-table-column-alt'
                                            : ''}"
                                    >
                                        {#if hasAttunements && atts.length === 1}
                                            <div class="space-y-1">
                                                <span
                                                    class="inline-block rounded-full px-2 sm:px-3.5 py-1 text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                                                    style="background-color: {attunementColor(
                                                        atts[0],
                                                    )}"
                                                    title={atts[0]}
                                                    >{spawn.location}</span
                                                >
                                                {#if spawn.spawn_point}
                                                    <div class="map-table-point text-[11px] font-medium uppercase tracking-wide">
                                                        {spawn.spawn_point}
                                                    </div>
                                                {/if}
                                            </div>
                                        {:else if hasAttunements && atts.length >= 2}
                                            <div class="space-y-1">
                                                <span
                                                    class="inline-block rounded-full px-2 sm:px-3.5 py-1 text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                                                    style="background: linear-gradient(to right, {attunementColor(
                                                        atts[0],
                                                    )} 50%, {attunementColor(
                                                        atts[1],
                                                    )} 50%)"
                                                    title="{atts[0]} / {atts[1]}"
                                                    >{spawn.location}</span
                                                >
                                                {#if spawn.spawn_point}
                                                    <div class="map-table-point text-[11px] font-medium uppercase tracking-wide">
                                                        {spawn.spawn_point}
                                                    </div>
                                                {/if}
                                            </div>
                                        {:else}
                                            <div class="space-y-1">
                                                <span class="map-table-location font-medium">
                                                    {spawn.location}
                                                </span>
                                                {#if spawn.spawn_point}
                                                    <div class="map-table-point text-[11px] font-medium uppercase tracking-wide">
                                                        {spawn.spawn_point}
                                                    </div>
                                                {/if}
                                            </div>
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
