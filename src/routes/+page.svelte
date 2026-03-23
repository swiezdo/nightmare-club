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
    import ResetCountdown from "$lib/components/ResetCountdown.svelte";
    import ThemeToggle from "$lib/components/ThemeToggle.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    let captureTarget: HTMLDivElement;
    let downloading = $state(false);

    async function downloadAsJpeg() {
        if (!captureTarget || downloading) return;
        downloading = true;
        try {
            const { domToJpeg } = await import("modern-screenshot");
            const isLight = document.documentElement.classList.contains("light");
            const dataUrl = await domToJpeg(captureTarget, {
                quality: 0.92,
                scale: 2,
                backgroundColor: isLight ? "#f6f0df" : "#181a20",
                style: { padding: "24px" },
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

    function formatWeekRange(weekStart: string): string {
        const start = new Date(weekStart + "T00:00:00");
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const fmt = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
        });
        return `${fmt.format(start)} – ${fmt.format(end)}`;
    }

    let currentWeek = $derived(() => {
        const firstRotation = data.maps.find((m) => m.rotation)?.rotation;
        if (!firstRotation) return "";
        return formatWeekRange(firstRotation.week_start);
    });

    let defaultTab = $derived(data.maps[0]?.slug ?? "");

    function shortName(name: string): string {
        const match = name.match(/\(([^)]+)\)/);
        return match ? match[1] : name;
    }
</script>

<div bind:this={captureTarget} class="mx-auto max-w-5xl px-2 py-4 sm:px-4 sm:py-8">
    <div class="mb-6 text-center">
        <div class="mb-3 flex justify-end" data-html2img-ignore>
            <ThemeToggle />
        </div>
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
            Nightmare Club — Spawn Rotations
        </h1>
        <!-- TODO fix week start
        {#if currentWeek()}
			<p class="mt-1 text-sm text-muted-foreground">Week of {currentWeek()}</p>
		{/if} -->
        <div class="mt-2">
            <ResetCountdown />
        </div>
        <div class="mt-3" data-html2img-ignore>
            <Button variant="secondary" size="sm" onclick={downloadAsJpeg} disabled={downloading}>
                <Download class="mr-1.5 h-3.5 w-3.5" />
                {downloading ? "Saving..." : "Download as Image"}
            </Button>
        </div>
    </div>

    {#if data.maps.length === 0}
        <p class="text-center text-muted-foreground">No rotation data available yet for this week.</p>
    {:else if data.maps.length === 1}
        <h2 class="mb-3 text-center text-lg font-semibold">{data.maps[0].name}</h2>
        <MapTable rotation={data.maps[0].rotation} mapSlug={data.maps[0].slug} />
    {:else}
        <Tabs value={defaultTab}>
            <TabsList class="mb-3 grid w-full" style="grid-template-columns: repeat({data.maps.length}, 1fr);">
                {#each data.maps as map}
                    <TabsTrigger value={map.slug} class="text-xs sm:text-sm"
                        >{shortName(map.name)}</TabsTrigger
                    >
                {/each}
            </TabsList>
            {#each data.maps as map}
                <TabsContent value={map.slug}>
                    <MapTable rotation={map.rotation} mapSlug={map.slug} />
                </TabsContent>
            {/each}
        </Tabs>
    {/if}
</div>
