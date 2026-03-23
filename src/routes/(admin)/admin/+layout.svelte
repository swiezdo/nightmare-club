<script lang="ts">
    import { goto } from "$app/navigation";
    import { createBrowserClient } from "@supabase/ssr";
    import {
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT,
    } from "$env/static/public";
    import { Button } from "$lib/components/ui/button";
    import ThemeToggle from "$lib/components/ThemeToggle.svelte";
    import type { Snippet } from "svelte";

    let { children }: { children: Snippet } = $props();

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
            class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3"
        >
            <h1 class="text-xl font-bold text-foreground">
                Nightmare Club Admin
            </h1>
            <div class="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="outline" onclick={handleLogout}>Logout</Button>
            </div>
        </div>
    </nav>

    <main class="mx-auto max-w-7xl px-4 py-6">
        {@render children()}
    </main>
</div>
