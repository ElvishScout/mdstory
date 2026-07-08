<script lang="ts">
  import { tick } from "svelte";
  import { type PromptProps, type Story, type StoryPrompt, type TemplateOptions } from "../../../../src";
  import FcInput from "./FcInput.svelte";
  import { processHtml } from "./process-html";

  // Keep reference to prevent tree-shaking of the custom element registration
  void FcInput;

  interface Props {
    story: Story;
    options?: TemplateOptions;
  }

  let { story, options = {} }: Props = $props();

  let scenes: PromptProps[] = $state([]);

  let lastSceneRef: HTMLDivElement | null = $state(null);
  let lastFormRef: HTMLFormElement | null = $state(null);
  let lastCoverRef: HTMLDivElement | null = $state(null);

  let resolver: ((formData: FormData) => void) | null = null;

  // Scroll to latest scene + play cover animation when scenes change
  $effect(() => {
    const count = scenes.length;
    if (count === 0) {
      return;
    }

    tick().then(() => {
      // Scroll the latest scene into view
      if (lastSceneRef) {
        lastSceneRef.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Animate the cover overlay on the latest scene
      if (lastCoverRef) {
        lastCoverRef.animate([{ top: "-100%" }, { top: "100%" }], { duration: 1000 });
      }
    });
  });

  const prompt: StoryPrompt = async (scene) => {
    if (!scene.text && scene.inputs.length === 0 && scene.navs.length === 0) {
      resolver = null;
      return;
    }

    scenes.push(scene);

    return new Promise<FormData>((resolve) => {
      resolver = resolve;
    });
  };

  $effect(() => {
    const timer = setTimeout(() => {
      story.play(prompt, { adapter: "html", debug: options.debug });
    }, 200);
    return () => clearTimeout(timer);
  });

  function resolveForm(form: HTMLFormElement, submitter?: HTMLElement | null) {
    if (resolver) {
      const formData = new FormData(form, submitter);
      resolver(formData);
      resolver = null;
    }
  }

  function handlePlayerClick() {
    if (!lastFormRef) {
      return;
    }

    const lastScene = scenes[scenes.length - 1];
    if (lastScene.navs.length) {
      return;
    }

    resolveForm(lastFormRef);
  }

  function handleFormKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  }

  function handleFormSubmit(e: SubmitEvent) {
    e.preventDefault();
    resolveForm(e.currentTarget as HTMLFormElement, e.submitter);
  }
</script>

<svelte:head>
  {#if story.stylesheet}
    <svelte:element this={"style"}>
      {@html story.stylesheet}
    </svelte:element>
  {/if}
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="px-2 md:px-12 pb-[33vh]" onclick={handlePlayerClick}>
  {#each scenes as { text }, i}
    {@const enabled = i === scenes.length - 1}
    <div
      class="scene-container relative px-2 pt-8 first:pt-4 md:first:pt-8 pb-8 first:mt-0 border-b-2 border-red-700 last:border-none overflow-hidden {!enabled
        ? 'opacity-50'
        : ''}"
      bind:this={lastSceneRef}
    >
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <form
        class="scene-form"
        bind:this={lastFormRef}
        onkeydown={handleFormKeyDown}
        onsubmit={enabled ? handleFormSubmit : (e) => e.preventDefault()}
      >
        {@html processHtml(text, !enabled)}
      </form>
      {#if enabled}
        <div
          class="scene-cover absolute left-0 right-0 top-full h-[200%] bg-linear-to-b from-transparent via-white to-white z-10"
          bind:this={lastCoverRef}
        ></div>
      {/if}
    </div>
  {/each}
</div>
