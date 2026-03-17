<script lang="ts">
	import { goto } from '$app/navigation';
	import { createBrowserClient } from '@supabase/ssr';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { Button } from '$lib/components/ui/button';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

<div class="min-h-screen bg-background">
	<nav class="border-b border-border bg-card">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
			<h1 class="text-xl font-bold text-foreground">Nightmare Club Admin</h1>
			<Button variant="outline" onclick={handleLogout}>Logout</Button>
		</div>
	</nav>

	<main class="mx-auto max-w-7xl px-4 py-6">
		{@render children()}
	</main>
</div>
