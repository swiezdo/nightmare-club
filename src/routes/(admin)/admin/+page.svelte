<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$lib/components/ui/button";
    import { Alert, AlertDescription } from "$lib/components/ui/alert";
    import { SegmentedControl } from "$lib/components/ui/segmented-control";
    import {
        ATTUNEMENT_NAMES,
        ROUND_STRUCTURE,
        ATTUNEMENT_MAP_SLUGS,
    } from "$lib/constants";
    import type { PageData, ActionData } from "./$types";

    let { data, form }: { data: PageData; form: ActionData } = $props();

    let selectedMapId = $state("");
    let selectedChallengeId = $state("");

    let selectedMap = $derived(
        data.maps?.find((m: any) => m.id === selectedMapId) ?? null,
    );
    let locations = $derived(selectedMap?.locations ?? []);
    let hasAttunements = $derived(
        ATTUNEMENT_MAP_SLUGS.has(selectedMap?.slug ?? ""),
    );

    let existingRotation = $derived(
        data.existingRotations?.find((r: any) => r.map_id === selectedMapId) ??
            null,
    );

    // Track second attunement visibility per spawn
    let showSecondAttunement: Record<string, boolean> = $state({});

    function getExistingSpawn(
        roundNum: number,
        waveNum: number,
        spawnIdx: number,
    ) {
        if (!existingRotation) return null;
        const round = existingRotation.rounds?.find(
            (r: any) => r.round_number === roundNum,
        );
        if (!round) return null;
        const wave = round.waves?.find((w: any) => w.wave_number === waveNum);
        if (!wave) return null;
        return (
            wave.spawns?.find((sp: any) => sp.spawn_order === spawnIdx) ?? null
        );
    }

    function getExistingAttunement(
        roundNum: number,
        waveNum: number,
        spawnIdx: number,
        idx: number,
    ): string {
        const spawn = getExistingSpawn(roundNum, waveNum, spawnIdx);
        if (!spawn) return "";
        const arr = spawn.element ?? [];
        return arr[idx] ?? "";
    }

    function spawnKey(r: number, w: number, s: number): string {
        return `${r}_${w}_${s}`;
    }

    function hasSecondAttunement(
        roundNum: number,
        waveNum: number,
        spawnIdx: number,
    ): boolean {
        const key = spawnKey(roundNum, waveNum, spawnIdx);
        if (showSecondAttunement[key] !== undefined)
            return showSecondAttunement[key];
        return getExistingAttunement(roundNum, waveNum, spawnIdx, 1) !== "";
    }

    // Initialise challenge from existing rotation
    $effect(() => {
        if (existingRotation?.challenge_id) {
            selectedChallengeId = existingRotation.challenge_id;
        }
    });

    const selectClass =
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
</script>

<div class="space-y-6">
    <h2 class="text-2xl font-bold">Edit Spawn Rotation</h2>

    {#if form?.success}
        <Alert
            class="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
        >
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
        <input type="hidden" name="challenge_id" value={selectedChallengeId} />
        <input type="hidden" name="map_slug" value={selectedMap?.slug ?? ""} />

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="space-y-2">
                <label
                    for="map_id"
                    class="text-sm font-semibold text-foreground">Map</label
                >
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
                <label
                    for="challenge_id"
                    class="text-sm font-semibold text-foreground"
                    >Challenge</label
                >
                <select
                    id="challenge_id"
                    class={selectClass}
                    bind:value={selectedChallengeId}
                >
                    <option value="">No Challenge</option>
                    {#each data.challenges as challenge}
                        <option value={challenge.id}
                            >{challenge.description}</option
                        >
                    {/each}
                </select>
            </div>

            <div class="space-y-2">
                <span class="text-sm font-semibold text-foreground"
                    >Week Start (Saturday)</span
                >
                <div
                    class="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm"
                >
                    {data.weekStart}
                </div>
            </div>
        </div>

        {#each Object.keys(ROUND_STRUCTURE).map(Number) as roundNum}
            {@const { waves: waveCount, spawns: spawnCount } =
                ROUND_STRUCTURE[roundNum as keyof typeof ROUND_STRUCTURE]}
            <div class="rounded-lg border-2 border-border p-4 space-y-4">
                <h3 class="text-lg font-bold text-foreground">
                    Stage {roundNum}
                </h3>

                {#each Array.from({ length: waveCount }, (_, i) => i + 1) as waveNum}
                    <div class="space-y-2">
                        <h4 class="text-sm font-semibold text-foreground/70">
                            Wave {waveNum}
                        </h4>
                        <div
                            class="grid gap-3 {spawnCount === 3
                                ? 'grid-cols-3'
                                : 'grid-cols-2'}"
                        >
                            {#each Array.from({ length: spawnCount }, (_, i) => i + 1) as spawnIdx}
                                {@const existing = getExistingSpawn(
                                    roundNum,
                                    waveNum,
                                    spawnIdx,
                                )}
                                {@const key = spawnKey(
                                    roundNum,
                                    waveNum,
                                    spawnIdx,
                                )}
                                <div
                                    class="rounded-md border-2 border-border/60 bg-card p-2 space-y-1.5 divide-accent"
                                >
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="text-xs font-bold text-foreground/60 w-5"
                                        >
                                            {spawnIdx}
                                        </span>
                                        <SegmentedControl
                                            options={locations}
                                            name={`round_${roundNum}_wave_${waveNum}_spawn_${spawnIdx}_location`}
                                            value={existing?.location ?? ""}
                                            required
                                        />
                                    </div>
                                    {#if hasAttunements}
                                        <div
                                            class="flex items-center gap-2 pl-7"
                                        >
                                            <SegmentedControl
                                                options={ATTUNEMENT_NAMES}
                                                name={`round_${roundNum}_wave_${waveNum}_spawn_${spawnIdx}_attunement_1`}
                                                value={getExistingAttunement(
                                                    roundNum,
                                                    waveNum,
                                                    spawnIdx,
                                                    0,
                                                )}
                                                required
                                            />
                                            {#if hasSecondAttunement(roundNum, waveNum, spawnIdx)}
                                                <SegmentedControl
                                                    options={ATTUNEMENT_NAMES}
                                                    name={`round_${roundNum}_wave_${waveNum}_spawn_${spawnIdx}_attunement_2`}
                                                    value={getExistingAttunement(
                                                        roundNum,
                                                        waveNum,
                                                        spawnIdx,
                                                        1,
                                                    )}
                                                />
                                                <button
                                                    type="button"
                                                    class="text-xs text-destructive hover:text-destructive/80"
                                                    onclick={() =>
                                                        (showSecondAttunement[
                                                            key
                                                        ] = false)}
                                                >
                                                    &times;
                                                </button>
                                            {:else}
                                                <button
                                                    type="button"
                                                    class="text-xs text-muted-foreground hover:text-foreground"
                                                    onclick={() =>
                                                        (showSecondAttunement[
                                                            key
                                                        ] = true)}
                                                >
                                                    +
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
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
