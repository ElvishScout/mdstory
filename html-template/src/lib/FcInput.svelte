<svelte:options customElement={{ tag: "fc-input", shadow: "none" }} />

<script lang="ts">
  let {
    type = "text",
    name = "",
    value = "",
    checked = false,
    disabled = false,
  }: {
    type?: string;
    name?: string;
    value?: string;
    /** When used as a web component, boolean attrs arrive as strings */
    checked?: boolean | string;
    disabled?: boolean | string;
  } = $props();

  // svelte-ignore state_referenced_locally
  let textValue = $state(value);

  /** Convert web-component string attributes to proper booleans */
  function toBool(v: boolean | string): boolean {
    if (typeof v === "boolean") {
      return v;
    }
    // HTML boolean attributes: presence (empty string) or "true" means true
    return v === "" || v === "true";
  }

  const isChecked = $derived(toBool(checked));
  const isDisabled = $derived(toBool(disabled));
</script>

{#if type === "checkbox"}
  <span class="mx-1">
    <label class="group p-0.5 -m-0.5 {!isDisabled && 'cursor-pointer'}">
      <input type="checkbox" class="sr-only" {name} {value} checked={isChecked} disabled={isDisabled} />
      <span
        class="relative inline-block -top-0.5 size-4 align-middle border-2 border-red-700 rounded-full group-has-disabled:cursor-default"
      >
        <svg
          class="hidden group-has-checked:block absolute left-[10%] top-[-35%] w-[140%] h-[140%]"
          width="256"
          height="256"
          viewBox="0 0 256 256"
        >
          <path
            d="m 242.84187,13.128487 5.34007,9.25615 q -52.1549,36.846623 -96.65558,93.273543 -44.50047,56.42731 -64.259111,110.53991 l -7.832128,5.16236 q -10.146142,6.58574 -17.444291,13.1719 -1.246014,-6.40811 -6.942114,-20.64802 l -4.094061,-10.14649 q -13.350231,-32.9303 -22.60638,-45.9248 -9.078154,-13.1722 -19.758334,-14.24018 14.418246,-13.17223 25.098456,-13.17223 14.774212,0 32.3965,39.69464 l 6.408134,14.24022 Q 103.9995,137.90858 148.50053,90.381805 193.17899,42.854984 242.84187,13.128487 Z"
          />
        </svg>
      </span>
    </label>
  </span>
{:else}
  <span class="inline-block relative mx-1 border-b-2 border-red-700 w-fit whitespace-pre has-disabled:bg-red-100">
    <span class="inline-block px-2 min-w-16 max-w-64 invisible whitespace-pre">{textValue}</span>
    <input
      class="absolute left-0 right-0 text-center bg-transparent border-none [font:inherit] text-inherit"
      {type}
      {name}
      value={textValue}
      disabled={isDisabled}
      oninput={(e) => (textValue = e.currentTarget.value)}
    />
  </span>
{/if}
