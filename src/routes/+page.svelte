<script lang="ts">
  import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
  } from "$lib/components/ui/tabs";
  import { Button } from "$lib/components/ui/button";
  import { Download } from "lucide-svelte";
  import MapTable from "$lib/components/MapTable.svelte";
  import WaveCards from "$lib/components/WaveCards.svelte";
  import TsushimaRotationTable from "$lib/components/TsushimaRotationTable.svelte";
  import ResetCountdown from "$lib/components/ResetCountdown.svelte";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import { RESET_SCHEDULE, TSUSHIMA_RESET_SCHEDULE } from "$lib/constants";
  import { onMount } from "svelte";
  import { readStoredTheme, type Theme } from "$lib/theme";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let captureTarget = $state<HTMLDivElement | undefined>(undefined);
  let downloading = $state(false);
  let theme = $state<Theme>("poster");
  let selectedMap = $state(0);
  let selectedTsushimaMap = $state(0);
  let game = $state<"yotei" | "tsushima">("yotei");

  onMount(() => {
    theme = readStoredTheme();
    if (data.maps.length === 0 && data.tsushimaMaps.length > 0) {
      game = "tsushima";
    }
  });

  let isPoster = $derived(theme === "poster");
  let currentMap = $derived(data.maps[selectedMap]);
  let currentTsushimaMap = $derived(data.tsushimaMaps[selectedTsushimaMap]);
  let hasAnyData = $derived(
    data.maps.length > 0 || data.tsushimaMaps.length > 0,
  );

  async function downloadAsJpeg() {
    if (!captureTarget || downloading) return;
    downloading = true;
    try {
      const { domToJpeg } = await import("modern-screenshot");
      const exportWidth = Math.max(captureTarget.clientWidth, 820);
      const backgroundColor = getComputedStyle(document.body).backgroundColor;
      const dataUrl = await domToJpeg(captureTarget, {
        quality: 0.92,
        scale: 2,
        backgroundColor,
        style: {
          padding: "24px",
          width: `${exportWidth}px`,
          maxWidth: `${exportWidth}px`,
          overflow: "hidden",
        },
        filter: (node: Node) => {
          if (
            node instanceof HTMLElement &&
            node.hasAttribute("data-html2img-ignore")
          )
            return false;
          return true;
        },
      });
      const link = document.createElement("a");
      link.download = `nightmare-club-rotations-${new Date().toISOString().slice(0, 10)}.jpg`;
      link.href = dataUrl;
      link.click();
    } finally {
      downloading = false;
    }
  }

  let defaultTab = $derived(data.maps[0]?.slug ?? "");
  let defaultTabTsushima = $derived(data.tsushimaMaps[0]?.slug ?? "");

  function shortName(name: string): string {
    const match = name.match(/\(([^)]+)\)/);
    return match ? match[1] : name;
  }

  let switchBorder = $derived(
    isPoster ? "border-white/25 bg-transparent" : "border-border bg-secondary/40",
  );
  let switchBtnActive = $derived(
    isPoster ? "bg-white text-[#131313]" : "bg-card font-semibold text-card-foreground shadow-sm",
  );
  let switchBtnInactive = $derived(
    isPoster
      ? "bg-transparent text-white"
      : "text-muted-foreground hover:text-foreground",
  );
</script>

<div class="mx-auto min-h-screen max-w-5xl px-2 py-4 sm:px-4 sm:py-8">
  {#if !hasAnyData}
    <div class="mb-6 flex justify-end" data-html2img-ignore>
      <ThemeToggle bind:theme />
    </div>
    <p class="text-center text-muted-foreground">
      No rotation data available yet for this week.
    </p>
  {:else}
    <!-- Mobile: theme on its own row (no overlap). sm+: game centered, theme right. -->
    <div
      class="mb-6 flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-2"
      data-html2img-ignore
    >
      <div
        class="flex shrink-0 justify-end sm:col-start-3 sm:row-start-1 sm:justify-end"
      >
        <ThemeToggle bind:theme />
      </div>
      <div
        class="flex w-full justify-center sm:col-start-2 sm:row-start-1 sm:w-auto sm:max-w-none"
      >
        <div
          class="flex min-w-0 flex-1 gap-1 rounded-md border p-0.5 sm:flex-initial sm:flex-nowrap {switchBorder}"
        >
          <button
            type="button"
            class="min-h-10 min-w-0 flex-1 rounded-[calc(var(--radius)-2px)] px-2 py-2 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide transition-colors sm:min-h-0 sm:flex-none sm:px-4 sm:text-xs whitespace-normal sm:whitespace-nowrap {game ===
            'yotei'
              ? switchBtnActive
              : switchBtnInactive}"
            onclick={() => (game = "yotei")}
          >
            <span class="sm:hidden">Yōtei</span>
            <span class="hidden sm:inline">Ghost of Yōtei</span>
          </button>
          <button
            type="button"
            class="min-h-10 min-w-0 flex-1 rounded-[calc(var(--radius)-2px)] px-2 py-2 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide transition-colors sm:min-h-0 sm:flex-none sm:px-4 sm:text-xs whitespace-normal sm:whitespace-nowrap {game ===
            'tsushima'
              ? switchBtnActive
              : switchBtnInactive}"
            onclick={() => (game = "tsushima")}
          >
            <span class="sm:hidden">Tsushima</span>
            <span class="hidden sm:inline">Ghost of Tsushima</span>
          </button>
        </div>
      </div>
      <div
        class="hidden sm:col-start-1 sm:row-start-1 sm:block"
        aria-hidden="true"
      ></div>
    </div>

    {#if game === "yotei"}
      {#if data.maps.length === 0}
        <p class="text-center text-muted-foreground">
          No Ghost of Yōtei rotation data for this week yet.
        </p>
      {:else if isPoster}
        {#if data.maps.length > 1}
          <div class="mb-6 flex gap-2 overflow-x-auto" data-html2img-ignore>
            {#each data.maps as map, i}
              <button
                class="whitespace-nowrap rounded-md border border-white/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors {selectedMap ===
                i
                  ? 'bg-white text-[#131313]'
                  : 'bg-transparent text-white'}"
                onclick={() => (selectedMap = i)}
              >
                {shortName(map.name)}
              </button>
            {/each}
          </div>
        {/if}

        <div bind:this={captureTarget}>
          <div class="mb-8">
            <div
              class="flex flex-col items-center text-center md:flex-row md:items-center md:text-left"
            >
              <div
                class="flex flex-col items-center md:flex-row md:items-center md:gap-4"
              >
                <img
                  src="/nightmare-logo.svg"
                  alt="Nightmare Club"
                  class="mb-3 h-16 w-auto md:mb-0 md:h-20"
                />
                <div>
                  <h1
                    class="text-2xl font-bold uppercase tracking-widest text-white md:text-4xl"
                  >
                    Nightmare Club
                  </h1>
                  <p
                    class="mt-1 text-sm font-medium uppercase tracking-[0.25em] text-white/70"
                  >
                    Spawn Rotations
                  </p>
                </div>
              </div>

              <div class="mt-4 md:mt-0 md:ml-auto">
                <ResetCountdown schedule={RESET_SCHEDULE} />
              </div>
            </div>

            <div class="my-5 h-px w-full bg-white"></div>

            <div
              class="flex flex-col items-center text-center md:flex-row md:items-start md:text-left"
            >
              {#if currentMap}
                <div>
                  <h2
                    class="text-sm font-bold uppercase tracking-wider text-white md:text-lg"
                  >
                    {currentMap.name
                      .replace("(", "- ")
                      .replace(")", "")
                      .toUpperCase()}
                  </h2>
                  {#if currentMap.rotation?.credit_text}
                    <p class="mt-1 text-xs text-white/60">
                      {currentMap.rotation.credit_text}
                    </p>
                  {/if}
                </div>
              {/if}

              <div class="mt-4 md:mt-0 md:ml-auto" data-html2img-ignore>
                <button
                  class="inline-flex items-center gap-2 rounded-md border border-transparent bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors md:border-white md:bg-transparent"
                  onclick={downloadAsJpeg}
                  disabled={downloading}
                >
                  <Download class="h-3.5 w-3.5" />
                  {downloading ? "Saving..." : "Download as Image"}
                </button>
              </div>
            </div>
          </div>

          <WaveCards rotation={currentMap?.rotation ?? null} />
        </div>
      {:else}
        <div bind:this={captureTarget}>
          <div class="mb-6 text-center">
            <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
              Nightmare Club — Ghost of Yōtei
            </h1>
            <div class="mt-2">
              <ResetCountdown schedule={RESET_SCHEDULE} />
            </div>
            <div class="mt-3" data-html2img-ignore>
              <Button
                variant="secondary"
                size="sm"
                onclick={downloadAsJpeg}
                disabled={downloading}
              >
                <Download class="mr-1.5 h-3.5 w-3.5" />
                {downloading ? "Saving..." : "Download as Image"}
              </Button>
            </div>
          </div>

          {#if data.maps.length === 1}
            <h2 class="mb-3 text-center text-lg font-semibold">
              {data.maps[0].name}
            </h2>
            {#if data.maps[0].rotation?.credit_text}
              <p class="mb-3 text-center text-sm text-muted-foreground">
                {data.maps[0].rotation.credit_text}
              </p>
            {/if}
            <MapTable
              rotation={data.maps[0].rotation}
              mapSlug={data.maps[0].slug}
            />
          {:else}
            <Tabs value={defaultTab}>
              <TabsList
                class="mb-3 grid w-full"
                style="grid-template-columns: repeat({data.maps.length}, 1fr);"
              >
                {#each data.maps as map}
                  <TabsTrigger value={map.slug} class="text-xs sm:text-sm"
                    >{shortName(map.name)}</TabsTrigger
                  >
                {/each}
              </TabsList>
              {#each data.maps as map}
                <TabsContent value={map.slug}>
                  {#if map.rotation?.credit_text}
                    <p class="mb-3 text-center text-sm text-muted-foreground">
                      {map.rotation.credit_text}
                    </p>
                  {/if}
                  <MapTable rotation={map.rotation} mapSlug={map.slug} />
                </TabsContent>
              {/each}
            </Tabs>
          {/if}
        </div>
      {/if}
    {:else if game === "tsushima"}
      {#if data.tsushimaMaps.length === 0}
        <p class="text-center text-muted-foreground">
          No Ghost of Tsushima rotation data for this week yet.
        </p>
      {:else if isPoster}
        {#if data.tsushimaMaps.length > 1}
          <div class="mb-6 flex gap-2 overflow-x-auto" data-html2img-ignore>
            {#each data.tsushimaMaps as map, i}
              <button
                class="whitespace-nowrap rounded-md border border-white/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors {selectedTsushimaMap ===
                i
                  ? 'bg-white text-[#131313]'
                  : 'bg-transparent text-white'}"
                onclick={() => (selectedTsushimaMap = i)}
              >
                {map.name}
              </button>
            {/each}
          </div>
        {/if}

        <div bind:this={captureTarget}>
          <div class="mb-8">
            <div
              class="flex flex-col items-center text-center md:flex-row md:items-center md:text-left"
            >
              <div
                class="flex flex-col items-center md:flex-row md:items-center md:gap-4"
              >
                <img
                  src="/nightmare-logo.svg"
                  alt="Nightmare Club"
                  class="mb-3 h-16 w-auto md:mb-0 md:h-20"
                />
                <div>
                  <h1
                    class="text-2xl font-bold uppercase tracking-widest text-white md:text-4xl"
                  >
                    Nightmare Club
                  </h1>
                  <p
                    class="mt-1 text-sm font-medium uppercase tracking-[0.25em] text-white/70"
                  >
                    Tsushima Spawn Rotations
                  </p>
                </div>
              </div>

              <div class="mt-4 md:mt-0 md:ml-auto">
                <ResetCountdown schedule={TSUSHIMA_RESET_SCHEDULE} />
              </div>
            </div>

            <div class="my-5 h-px w-full bg-white"></div>

            <div
              class="flex flex-col items-center text-center md:flex-row md:items-start md:text-left"
            >
              {#if currentTsushimaMap}
                <div>
                  <h2
                    class="text-sm font-bold uppercase tracking-wider text-white md:text-lg"
                  >
                    {currentTsushimaMap.name.toUpperCase()}
                  </h2>
                  {#if currentTsushimaMap.rotation?.credit_text}
                    <p class="mt-1 text-xs text-white/60">
                      {currentTsushimaMap.rotation.credit_text}
                    </p>
                  {/if}
                </div>
              {/if}

              <div class="mt-4 md:mt-0 md:ml-auto" data-html2img-ignore>
                <button
                  class="inline-flex items-center gap-2 rounded-md border border-transparent bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors md:border-white md:bg-transparent"
                  onclick={downloadAsJpeg}
                  disabled={downloading}
                >
                  <Download class="h-3.5 w-3.5" />
                  {downloading ? "Saving..." : "Download as Image"}
                </button>
              </div>
            </div>
          </div>

          <TsushimaRotationTable
            payload={currentTsushimaMap?.rotation?.payload ?? null}
            poster={true}
          />
        </div>
      {:else}
        <div bind:this={captureTarget}>
          <div class="mb-6 text-center">
            <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
              Nightmare Club — Ghost of Tsushima
            </h1>
            <div class="mt-2">
              <ResetCountdown schedule={TSUSHIMA_RESET_SCHEDULE} />
            </div>
            <div class="mt-3" data-html2img-ignore>
              <Button
                variant="secondary"
                size="sm"
                onclick={downloadAsJpeg}
                disabled={downloading}
              >
                <Download class="mr-1.5 h-3.5 w-3.5" />
                {downloading ? "Saving..." : "Download as Image"}
              </Button>
            </div>
          </div>

          {#if data.tsushimaMaps.length === 1}
            <h2 class="mb-3 text-center text-lg font-semibold">
              {data.tsushimaMaps[0].name}
            </h2>
            {#if data.tsushimaMaps[0].rotation?.credit_text}
              <p class="mb-3 text-center text-sm text-muted-foreground">
                {data.tsushimaMaps[0].rotation.credit_text}
              </p>
            {/if}
            <TsushimaRotationTable
              payload={data.tsushimaMaps[0].rotation.payload}
            />
          {:else}
            <Tabs value={defaultTabTsushima}>
              <TabsList
                class="mb-3 grid w-full"
                style="grid-template-columns: repeat({data.tsushimaMaps.length}, 1fr);"
              >
                {#each data.tsushimaMaps as map}
                  <TabsTrigger value={map.slug} class="text-xs sm:text-sm"
                    >{map.name}</TabsTrigger
                  >
                {/each}
              </TabsList>
              {#each data.tsushimaMaps as map}
                <TabsContent value={map.slug}>
                  {#if map.rotation?.credit_text}
                    <p class="mb-3 text-center text-sm text-muted-foreground">
                      {map.rotation.credit_text}
                    </p>
                  {/if}
                  <TsushimaRotationTable payload={map.rotation.payload} />
                </TabsContent>
              {/each}
            </Tabs>
          {/if}
        </div>
      {/if}
    {/if}
  {/if}
</div>
