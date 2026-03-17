<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { badgeVariants, type BadgeVariant } from "./variants.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement> & {
		variant?: BadgeVariant;
		children?: Snippet;
	};

	let { class: className, variant = "default", children, ...restProps }: Props = $props();
</script>

<div class={cn(badgeVariants({ variant }), className)} {...restProps}>
	{@render children?.()}
</div>
