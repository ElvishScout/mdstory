<script lang="ts">
  import { tick } from "svelte";
  import { type Story, type StoryPrompt } from "../../../";
  import FcInput from "./FcInput.svelte";
  import { processHtml } from "./process-html";

  // Keep reference to prevent tree-shaking of the custom element registration
  void FcInput;

  interface Props {
    story: Story;
    debug?: boolean;
  }

  let { story, debug = false }: Props = $props();

  type Stage = "ready" | "started" | "ended";
  type SceneLog = { html: string };

  let stage: Stage = $state("ready");
  let scenes: SceneLog[] = $state([]);
  let resolveRef: ((formData: FormData) => void) | null = null;

  // Scroll to latest scene + play cover animation when scenes change
  $effect(() => {
    const count = scenes.length;
    if (count === 0) return;

    tick().then(() => {
      // Scroll the latest scene into view
      const sceneDivs = document.querySelectorAll<HTMLElement>(".scene-container");
      const latestScene = sceneDivs[sceneDivs.length - 1];
      if (latestScene) {
        latestScene.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Animate the cover overlay on the latest scene
      const coverDiv = latestScene?.querySelector<HTMLElement>(".scene-cover");
      if (coverDiv) {
        coverDiv.animate([{ top: "-100%" }, { top: "100%" }], { duration: 1000 });
      }
    });
  });

  const prompt: StoryPrompt = async ({ text }) => {
    scenes.push({ html: text });
    return new Promise<FormData>((resolve) => {
      resolveRef = resolve;
    });
  };

  function handleCoverClick() {
    story.play(prompt, { renderer: "html", debug }).then(() => (stage = "ended"));
    stage = "started";
  }

  function handleFormKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  }

  function handleFormSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (resolveRef) {
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form, e.submitter);
      resolveRef(formData);
      resolveRef = null;
    }
  }
</script>

<div class="px-2 md:px-12">
  <div>
    {#each scenes as { html }, i}
      {@const enabled = stage === "started" && i === scenes.length - 1}
      <div
        class="scene-container relative px-2 pt-8 first:pt-4 md:first:pt-8 pb-8 last:pb-[33vh] first:mt-0 border-b-2 border-red-700 last:border-none overflow-hidden {!enabled
          ? 'opacity-50'
          : ''}"
      >
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <form
          class="scene-form"
          onkeydown={handleFormKeyDown}
          onsubmit={enabled ? handleFormSubmit : (e) => e.preventDefault()}
        >
          {@html processHtml(html)}
        </form>
        {#if enabled}
          <div
            class="scene-cover absolute left-0 right-0 top-full h-[200%] bg-linear-to-b from-transparent via-white to-white z-10"
          ></div>
        {/if}
      </div>
    {/each}
  </div>

  {#if stage === "ready"}
    <div
      class="fixed inset-0 flex flex-col justify-center items-center text-4xl leading-0 select-none backdrop-blur-xs z-10 after:content-[''] after:h-16"
      onclick={handleCoverClick}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === "Enter" && handleCoverClick()}
    >
      Click to start
    </div>
  {/if}
</div>
