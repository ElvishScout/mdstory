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
    checked?: boolean;
    disabled?: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  let textValue = $state(value);
</script>

{#if type === "checkbox"}
  <span class="fc-checkbox">
    <label>
      <input type="checkbox" {name} {value} {checked} {disabled} />
      <span class="fc-circle">
        <svg width="256" height="256" viewBox="0 0 256 256">
          <path
            d="m 242.84187,13.128487 5.34007,9.25615 q -52.1549,36.846623 -96.65558,93.273543 -44.50047,56.42731 -64.259111,110.53991 l -7.832128,5.16236 q -10.146142,6.58574 -17.444291,13.1719 -1.246014,-6.40811 -6.942114,-20.64802 l -4.094061,-10.14649 q -13.350231,-32.9303 -22.60638,-45.9248 -9.078154,-13.1722 -19.758334,-14.24018 14.418246,-13.17223 25.098456,-13.17223 14.774212,0 32.3965,39.69464 l 6.408134,14.24022 Q 103.9995,137.90858 148.50053,90.381805 193.17899,42.854984 242.84187,13.128487 Z"
          />
        </svg>
      </span>
    </label>
  </span>
{:else}
  <span class="fc-text">
    <span class="fc-text-mirror">{textValue}</span>
    <input {type} {name} value={textValue} {disabled} oninput={(e) => (textValue = e.currentTarget.value)} />
  </span>
{/if}

<style>
  /* ---- checkbox ---- */
  .fc-checkbox {
    margin: 0 0.25rem;
  }
  .fc-checkbox label {
    padding: 0.125rem;
    margin: -0.125rem;
    cursor: pointer;
  }
  .fc-checkbox input {
    position: absolute;
    clip: rect(0, 0, 0, 0);
  }
  .fc-circle {
    position: relative;
    display: inline-block;
    top: -0.125rem;
    width: 1rem;
    height: 1rem;
    vertical-align: middle;
    border: 2px solid #b91c1c;
    border-radius: 50%;
  }
  .fc-circle svg {
    display: none;
    position: absolute;
    left: 10%;
    top: -35%;
    width: 140%;
    height: 140%;
  }
  .fc-checkbox input:checked + .fc-circle svg {
    display: block;
  }
  .fc-checkbox input:disabled + .fc-circle {
    cursor: default;
  }

  /* ---- text ---- */
  .fc-text {
    display: inline-block;
    margin: 0 0.25rem;
    border-bottom: 2px solid #b91c1c;
  }
  .fc-text:has(input:disabled) {
    background: #fee2e2;
  }
  .fc-text-mirror {
    display: inline-block;
    padding: 0 0.5rem;
    min-width: 4rem;
    max-width: 16rem;
    visibility: hidden;
    white-space: pre;
  }
  .fc-text input {
    position: absolute;
    left: 0;
    right: 0;
    text-align: center;
    background: transparent;
    border: none;
    outline: none;
    font: inherit;
    color: inherit;
  }
  .fc-text {
    position: relative;
    width: fit-content;
    white-space: pre;
  }
</style>
