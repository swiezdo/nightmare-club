<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { buttonVariants, type ButtonVariant, type ButtonSize } from "./variants.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	type Props = HTMLButtonAttributes & {
		variant?: ButtonVariant;
		size?: ButtonSize;
		children?: Snippet;
	};

	let {
		class: className,
		variant = "default",
		size = "default",
		children,
		...restProps
	}: Props = $props();
</script>

<button class={cn(buttonVariants({ variant, size }), className)} {...restProps}>
	{@render children?.()}
</button>
