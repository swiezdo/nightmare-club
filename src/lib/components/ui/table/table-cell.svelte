<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLTdAttributes } from "svelte/elements";

	type Props = HTMLTdAttributes & {
		children?: Snippet;
	};

	let { class: className, children, ...restProps }: Props = $props();
</script>

<td
	class={cn(
		"p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</td>
