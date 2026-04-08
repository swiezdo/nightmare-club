<script lang="ts">
	import { RESET_SCHEDULE, type ResetSchedule } from '$lib/constants';
	import { getNextResetMs } from '$lib/dates';

	let {
		schedule = RESET_SCHEDULE,
	}: {
		schedule?: ResetSchedule;
	} = $props();

	let now = $state(Date.now());

	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(id);
	});

	let resetMs = $derived(getNextResetMs(schedule, now));
	let remaining = $derived(resetMs - now);

	function formatCountdown(ms: number): string {
		if (ms <= 0) return 'Resetting now!';
		const totalSec = Math.floor(ms / 1000);
		const d = Math.floor(totalSec / 86400);
		const h = Math.floor((totalSec % 86400) / 3600);
		const m = Math.floor((totalSec % 3600) / 60);
		const s = totalSec % 60;
		const parts: string[] = [];
		if (d > 0) parts.push(`${d}d`);
		parts.push(`${h}h`);
		parts.push(`${String(m).padStart(2, '0')}m`);
		parts.push(`${String(s).padStart(2, '0')}s`);
		return parts.join(' ');
	}

	function formatLocalTime(ms: number): string {
		return new Date(ms).toLocaleString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	}
</script>

<div class="text-center text-sm text-muted-foreground">
	<span>Next reset: <strong class="text-foreground">{formatCountdown(remaining)}</strong></span>
	<span class="mx-1">&middot;</span>
	<span title="In your browser’s local timezone">{formatLocalTime(resetMs)}</span>
</div>
