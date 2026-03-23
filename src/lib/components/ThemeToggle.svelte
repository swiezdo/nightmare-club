<script lang="ts">
	import { onMount } from 'svelte';
	import { Moon, Sun } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { applyTheme, persistTheme, readStoredTheme, type Theme } from '$lib/theme';

	let theme = $state<Theme>('dark');

	function setTheme(nextTheme: Theme) {
		theme = nextTheme;
		applyTheme(nextTheme);
		persistTheme(nextTheme);
	}

	onMount(() => {
		theme = readStoredTheme();
		applyTheme(theme);
	});
</script>

<Button
	type="button"
	variant="outline"
	size="sm"
	class="gap-1.5"
	onclick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
	aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
>
	{#if theme === 'dark'}
		<Sun class="h-3.5 w-3.5" />
		Light mode
	{:else}
		<Moon class="h-3.5 w-3.5" />
		Dark mode
	{/if}
</Button>
