<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import type { PageData, ActionData } from "./$types";
  import type { TsushimaMapRow } from "$lib/types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let selectedMapId = $state("");

  let selectedMap = $derived(
    data.maps?.find((m: TsushimaMapRow) => m.id === selectedMapId) ?? null,
  );

  let existingRotation = $derived(
    data.existingRotations?.find((r: { map_id: string }) => r.map_id === selectedMapId) ??
      null,
  );

  function pairValue(zone: string, spawn: string): string {
    return `${zone}\t${spawn}`;
  }

  function cellLabel(zone: string, spawn: string): string {
    return zone === spawn ? zone : `${zone} — ${spawn}`;
  }

  function isSelectedPair(
    w: number,
    s: number,
    zone: string,
    spawn: string,
  ): boolean {
    const payload = existingRotation?.payload as
      | { waves?: { wave: number; spawns: { order: number; zone: string; spawn: string }[] }[] }
      | undefined;
    const waves = payload?.waves;
    if (!waves) return false;
    const wave = waves.find((x) => x.wave === w);
    const sp = wave?.spawns?.find((x) => x.order === s);
    return sp?.zone === zone && sp?.spawn === spawn;
  }

  $effect(() => {
    if (form?.savedMapId) {
      selectedMapId = form.savedMapId;
    }
  });

  $effect(() => {
    if (selectedMapId) return;
    if (data.maps?.length === 1) {
      selectedMapId = data.maps[0].id;
    }
  });

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
</script>

<div class="space-y-6">
  <h2 class="text-2xl font-bold">Edit Tsushima Spawn Rotation</h2>

  {#if form?.success}
    <Alert
      class="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
    >
      <AlertDescription>Tsushima rotation saved successfully!</AlertDescription>
    </Alert>
  {/if}

  {#if form?.error}
    <Alert variant="destructive">
      <AlertDescription>{form.error}</AlertDescription>
    </Alert>
  {/if}

  {#if data.maps.length === 0}
    <p class="text-muted-foreground">
      No Tsushima maps in database. Run Supabase migrations.
    </p>
  {:else}
    <form method="POST" action="?/save" use:enhance class="space-y-8">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <label for="ts_map_id" class="text-sm font-semibold text-foreground"
            >Map</label
          >
          <select
            id="ts_map_id"
            name="map_id"
            class={selectClass}
            bind:value={selectedMapId}
            required
          >
            <option value="" disabled>Select a map…</option>
            {#each data.maps as map}
              <option value={map.id}>{map.name}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-2">
          <span class="text-sm font-semibold text-foreground"
            >Week Start (Friday)</span
          >
          <div
            class="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm"
          >
            {data.weekStart}
          </div>
        </div>
      </div>

      {#if selectedMap}
        {#key selectedMapId}
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <label for="week_code" class="text-sm font-semibold text-foreground"
                >Week code</label
              >
              <select
                id="week_code"
                name="week_code"
                class={selectClass}
                required
              >
                {#each selectedMap.week_options as opt}
                  <option
                    value={opt.code}
                    selected={opt.code ===
                      (existingRotation?.week_code ??
                        selectedMap.week_options[0]?.code)}
                    >{opt.code}</option
                  >
                {/each}
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label for="credit_text" class="text-sm font-semibold text-foreground"
              >Credit / thanks</label
            >
            <Input
              id="credit_text"
              name="credit_text"
              value={existingRotation?.credit_text ?? ""}
              placeholder="Thanks to…"
              class="h-10"
            />
          </div>

          <div class="space-y-4">
            <h3 class="text-lg font-bold text-foreground">Waves (15 × 3 spawns)</h3>
            <p class="text-xs text-muted-foreground">
              Each slot: valid zone/spawn pair for this map.
            </p>

            {#each Array.from({ length: 15 }, (_, i) => i + 1) as waveNum}
              <div class="rounded-lg border-2 border-border p-4 space-y-2">
                <h4 class="text-sm font-semibold text-foreground/80">
                  Wave {waveNum}
                </h4>
                <div class="grid gap-3 sm:grid-cols-3">
                  {#each Array.from({ length: 3 }, (_, i) => i + 1) as spawnIdx}
                    <div class="space-y-1">
                      <span class="text-xs font-medium text-muted-foreground"
                        >Spawn {spawnIdx}</span
                      >
                      <select
                        name={`wave_${waveNum}_spawn_${spawnIdx}`}
                        class={selectClass}
                        required
                      >
                        {#each selectedMap.zones as z}
                          {#each z.spawns as sp}
                            <option
                              value={pairValue(z.zone, sp)}
                              selected={isSelectedPair(
                                waveNum,
                                spawnIdx,
                                z.zone,
                                sp,
                              )}
                            >
                              {cellLabel(z.zone, sp)}
                            </option>
                          {/each}
                        {/each}
                      </select>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>

          <Button type="submit" class="w-full sm:w-auto">Save rotation</Button>
        {/key}
      {/if}
    </form>
  {/if}
</div>
