<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { createBrowserClient } from "@supabase/ssr";
    import {
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT,
    } from "$env/static/public";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { cn } from "$lib/utils.js";
    import ThemeToggle from "$lib/components/ThemeToggle.svelte";
    import type { Snippet } from "svelte";

    let { children }: { children: Snippet } = $props();

    let yoteiActive = $derived(page.url.pathname.startsWith("/admin/tsushima") === false);
    let tsushimaActive = $derived(page.url.pathname.startsWith("/admin/tsushima"));

    const supabase = createBrowserClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT,
    );

    async function handleLogout() {
        await supabase.auth.signOut();
        goto("/login");
    }
</script>

<div class="min-h-screen bg-background">
    <nav class="border-b border-border bg-card">
        <div
            class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
            <h1 class="text-xl font-bold text-foreground">
                Nightmare Club Admin
            </h1>
            <div
                class="flex flex-wrap items-center justify-center gap-1 rounded-md border border-border bg-secondary/40 p-0.5 sm:justify-start"
            >
                <a
                    href="/admin"
                    class={cn(
                        buttonVariants({
                            variant: yoteiActive ? "default" : "ghost",
                            size: "sm",
                        }),
                        "text-xs sm:text-sm",
                    )}>Ghost of Yōtei</a
                >
                <a
                    href="/admin/tsushima"
                    class={cn(
                        buttonVariants({
                            variant: tsushimaActive ? "default" : "ghost",
                            size: "sm",
                        }),
                        "text-xs sm:text-sm",
                    )}>Ghost of Tsushima</a
                >
            </div>
            <div class="flex items-center justify-end gap-2 sm:ml-auto">
                <ThemeToggle />
                <Button variant="outline" onclick={handleLogout}>Logout</Button>
            </div>
        </div>
    </nav>

    <main class="mx-auto max-w-7xl px-4 py-6">
        {@render children()}
    </main>
</div>
