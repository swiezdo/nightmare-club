<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";

	type Props = SelectPrimitive.RootProps & {
		children?: Snippet;
	};

	let { children, ...restProps }: Props = $props();
</script>

<SelectPrimitive.Root {...restProps}>
	{@render children?.()}
</SelectPrimitive.Root>
