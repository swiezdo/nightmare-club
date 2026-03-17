<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";

	type Props = SelectPrimitive.ValueProps & {
		class?: string;
	};

	let { class: className, ...restProps }: Props = $props();
</script>

<SelectPrimitive.Value class={className} {...restProps} />
