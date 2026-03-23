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
<div class="segmented-control">
    {#each options as option}
        <button
            type="button"
            class="segmented-control__option {value === option
                ? 'segmented-control__option--active'
                : 'segmented-control__option--inactive'}"
            onclick={() => (value = option)}
        >
            {option}
        </button>
    {/each}
</div>
