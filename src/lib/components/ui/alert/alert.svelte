<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { alertVariants, type AlertVariant } from "./variants.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement> & {
		variant?: AlertVariant;
		children?: Snippet;
	};

	let { class: className, variant = "default", children, ...restProps }: Props = $props();
</script>

<div role="alert" class={cn(alertVariants({ variant }), className)} {...restProps}>
	{@render children?.()}
</div>
