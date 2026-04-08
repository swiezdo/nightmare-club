<script lang="ts">
  import type { TsushimaPayloadJson } from "$lib/types";

  let {
    payload,
    poster = false,
  }: {
    payload: TsushimaPayloadJson | null;
    poster?: boolean;
  } = $props();

  type WaveMod = { wave: number; name: string; icon?: string };

  let waves = $derived(
    payload?.waves ? [...payload.waves].sort((a, b) => a.wave - b.wave) : [],
  );

  function chunkByThree<T>(arr: T[]): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += 3) {
      out.push(arr.slice(i, i + 3));
    }
    return out;
  }

  let waveBlocks = $derived(chunkByThree(waves));

  function modifierForWave(waveNum: number): string | null {
    const raw = payload?.wave_modifiers;
    if (!Array.isArray(raw)) return null;
    for (const x of raw) {
      if (
        x &&
        typeof x === "object" &&
        "wave" in x &&
        (x as WaveMod).wave === waveNum
      ) {
        return (x as WaveMod).name ?? null;
      }
    }
    return null;
  }

  let borderClass = $derived(poster ? "border-white/25" : "border-border");
</script>

{#if !payload || waves.length === 0}
  <p
    class="py-8 text-center text-sm {poster
      ? 'text-white/70'
      : 'text-muted-foreground'}"
  >
    No Tsushima wave data in this rotation.
  </p>
{:else}
  <!-- Weekly summary strip (once) -->
  <div
    class="map-table-stage mb-5 overflow-hidden rounded-lg border {borderClass}"
  >
    <div class="map-table-stage-header border-b px-3 py-3 {borderClass}">
      <div
        class="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between"
      >
        <h3
          class="text-sm font-bold uppercase tracking-[0.12em] sm:text-base {poster
            ? 'text-[#FFBD39]'
            : 'map-table-stage-title'}"
        >
          Week {payload.week_code}
        </h3>
        {#if payload.weekly_modifiers?.length}
          <span
            class="text-xs font-medium leading-snug tracking-wide sm:text-sm {poster
              ? 'text-white/85'
              : 'map-table-note'}"
          >
            {payload.weekly_modifiers.map((m) => m.name).join(" · ")}
          </span>
        {/if}
      </div>
    </div>
  </div>

  <div class="space-y-5">
    {#each waveBlocks as block, blockIndex}
      {@const startW = block[0]?.wave ?? blockIndex * 3 + 1}
      {@const endW = block[block.length - 1]?.wave ?? startW + block.length - 1}
      {@const powerWaveName = modifierForWave(endW)}
      <div class="map-table-stage overflow-hidden rounded-lg border {borderClass}">
        <div class="map-table-stage-header border-b px-3 py-3 {borderClass}">
          <div
            class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
          >
            <h3
              class="text-sm font-bold uppercase tracking-[0.18em] sm:text-sm {poster
                ? 'text-[#FFBD39]'
                : 'map-table-stage-title'}"
            >
              Waves {startW}–{endW}
            </h3>
            {#if powerWaveName}
              <span
                class="text-[11px] font-semibold uppercase tracking-wide sm:text-xs {poster
                  ? 'text-[#FFBD39]/90'
                  : 'map-table-note'}"
                title="Modifier on wave {endW}"
              >
                {powerWaveName}
              </span>
            {/if}
          </div>
        </div>

        <table class="w-full table-fixed text-xs sm:text-sm">
          <thead>
            <tr class="map-table-header-row border-b text-[10px] uppercase tracking-wider {borderClass}">
              <th
                class="w-11 px-1 py-2 text-left font-bold sm:w-12 sm:px-2 sm:text-xs"
              >
                Wave
              </th>
              <th
                class="px-1 py-2 text-center font-bold sm:px-2 sm:text-xs"
              >
                Spawn 1
              </th>
              <th
                class="map-table-column-alt px-1 py-2 text-center font-bold sm:px-2 sm:text-xs"
              >
                Spawn 2
              </th>
              <th class="px-1 py-2 text-center font-bold sm:px-2 sm:text-xs">
                Spawn 3
              </th>
            </tr>
          </thead>
          <tbody>
            {#each block as wave}
              <tr class="map-table-row border-b last:border-0 {poster ? 'border-white/12' : ''}">
                <td
                  class="map-table-wave px-1 py-2.5 align-middle font-mono text-[11px] font-bold tabular-nums tracking-tight sm:px-2 sm:py-3.5 sm:text-xs"
                >
                  {wave.wave}
                </td>
                {#each [...wave.spawns].sort((a, b) => a.order - b.order) as spawn, si}
                  <td
                    class="px-1 py-2.5 align-top sm:px-2 sm:py-3.5 {(si + 1) % 2 === 0
                      ? 'map-table-column-alt'
                      : ''}"
                  >
                    <div
                      class="flex min-h-[2.75rem] flex-col justify-center sm:min-h-[3rem] {poster
                        ? 'items-center px-0.5 text-center'
                        : 'pl-[22%] sm:pl-[32%]'}"
                    >
                      {#if spawn.zone === spawn.spawn}
                        <span
                          class="map-table-location break-words text-[11px] font-bold uppercase leading-snug tracking-wide sm:text-[13px]"
                        >
                          {spawn.zone}
                        </span>
                      {:else}
                        <span
                          class="map-table-location break-words text-[11px] font-bold uppercase leading-snug tracking-wide sm:text-[13px]"
                        >
                          {spawn.zone}
                        </span>
                        <span
                          class="map-table-point mt-1 break-words text-[10px] font-semibold uppercase leading-tight tracking-[0.2em] sm:text-[11px]"
                        >
                          {spawn.spawn}
                        </span>
                      {/if}
                    </div>
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
