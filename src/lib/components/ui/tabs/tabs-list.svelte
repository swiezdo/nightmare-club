<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Tabs as TabsPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";

	type Props = TabsPrimitive.ListProps & {
		class?: string;
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<TabsPrimitive.List
	class={cn(
		"inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.List>
