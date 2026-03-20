<script lang="ts">
	/** Countdown to next Tuesday 1:00 AM Australia/Sydney */

	let now = $state(Date.now());

	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(id);
	});

	let resetMs = $derived(getNextReset(now));
	let remaining = $derived(resetMs - now);

	function sydneyDay(date: Date): { weekday: number; hour: number; dateStr: string } {
		// Get the current day/hour in Sydney using Intl
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone: 'Australia/Sydney',
			weekday: 'short',
			hour: 'numeric',
			hour12: false,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(date);

		const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? '';
		const dayMap: Record<string, number> = {
			Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
		};

		return {
			weekday: dayMap[weekdayStr] ?? 0,
			hour: parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0'),
			dateStr: `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}-${parts.find((p) => p.type === 'day')?.value}`
		};
	}

	function getNextReset(currentMs: number): number {
		const date = new Date(currentMs);
		const syd = sydneyDay(date);

		// Days until next Tuesday (2)
		let daysAhead = (2 - syd.weekday + 7) % 7;
		// If it's already Tuesday past 1am Sydney, next week
		if (daysAhead === 0 && syd.hour >= 1) daysAhead = 7;

		// Build the target date string in Sydney
		const target = new Date(currentMs + daysAhead * 86400000);
		const targetSyd = sydneyDay(target);

		// Now we need Tuesday 1:00 AM Sydney as a UTC timestamp.
		// Use the target date string + "01:00" and resolve via offset probing.
		const targetStr = targetSyd.dateStr;
		// Create two candidate UTC times and check which one lands on 1am Sydney
		// Guess: Sydney is UTC+10 or UTC+11
		for (const offsetHours of [11, 10]) {
			const utcMs = new Date(`${targetStr}T01:00:00Z`).getTime() - offsetHours * 3600000;
			// Verify this actually is 1am Sydney
			const check = new Intl.DateTimeFormat('en-US', {
				timeZone: 'Australia/Sydney',
				hour: 'numeric',
				hour12: false
			}).format(new Date(utcMs));
			if (parseInt(check) === 1) {
				return utcMs;
			}
		}

		// Fallback with UTC+11
		return new Date(`${targetSyd.dateStr}T01:00:00Z`).getTime() - 11 * 3600000;
	}

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
			minute: '2-digit'
		});
	}
</script>

<div class="text-center text-sm text-muted-foreground">
	<span>Next reset: <strong class="text-foreground">{formatCountdown(remaining)}</strong></span>
	<span class="mx-1">&middot;</span>
	<span>{formatLocalTime(resetMs)}</span>
</div>
