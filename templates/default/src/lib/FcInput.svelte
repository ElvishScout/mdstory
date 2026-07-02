<svelte:options customElement={{ tag: "fc-input", shadow: "none" }} />

<script lang="ts">
  import checkmarkSvg from "../assets/icons/checkmark.svg";

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
  <span class="inline-block mx-1">
    <label class="group p-0.5 -m-0.5 {!isDisabled && 'cursor-pointer'}">
      <input type="checkbox" class="sr-only" {name} {value} checked={isChecked} disabled={isDisabled} />
      <span
        class="relative inline-block -top-0.5 size-4 align-middle border-2 border-red-700 rounded-full group-has-disabled:cursor-default"
      >
        <img
          class="hidden group-has-checked:block absolute left-[10%] top-[-35%] w-[140%] max-w-none h-[140%] select-none"
          src={checkmarkSvg}
          alt="checkmark"
        />
      </span>
    </label>
  </span>
{:else}
  <span class="inline-block relative mx-1 w-fit">
    <span class="inline-block px-2 min-w-16 max-w-64 invisible whitespace-pre">{textValue}</span>
    <input
      class="absolute left-0 right-0 text-center bg-transparent border-b-2 border-red-700 disabled:bg-red-100"
      {type}
      {name}
      value={textValue}
      disabled={isDisabled}
      oninput={(e) => (textValue = e.currentTarget.value)}
    />
  </span>
{/if}

<style>
  :global(fc-input) {
    display: inline-block;
  }
</style>
