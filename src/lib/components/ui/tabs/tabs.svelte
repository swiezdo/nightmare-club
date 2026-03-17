<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Tabs as TabsPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";

	type Props = TabsPrimitive.RootProps & {
		class?: string;
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<TabsPrimitive.Root class={cn(className)} {...restProps}>
	{@render children?.()}
</TabsPrimitive.Root>
