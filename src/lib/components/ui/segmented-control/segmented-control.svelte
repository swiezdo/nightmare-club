<script lang="ts">
    let {
        options,
        name,
        value = $bindable(""),
        required = false,
    }: {
        options: readonly string[];
        name: string;
        value: string;
        required?: boolean;
    } = $props();
</script>

<input type="hidden" {name} {value} {required} />
<div class="inline-flex h-7 items-center p-0.5 text-muted-foreground">
    {#each options as option}
        <button
            type="button"
            class="px-2 py-1 text-xs transition-colors hover:cursor-pointer {value ===
            option
                ? 'bg-foreground text-gray-300 rounded-md'
                : 'hover:text-foreground/80 hover:bg-accent-foreground hover:rounded-md hover:text-gray-300'}"
            onclick={() => (value = option)}
        >
            {option}
        </button>
    {/each}
</div>
