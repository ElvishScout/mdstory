<script lang="ts">
  import { tick } from "svelte";
  import type { PromptProps, PromptResult, Section, Story, StoryPrompt, StorySession } from "../../../../src";
  import FcInput from "./FcInput.svelte";
  import { processHtml } from "../lib/utils";
  import type { TemplateOptions } from "../types";

  // Keep reference to prevent tree-shaking of the custom element registration
  void FcInput;

  function collectStyles(section: Section): string {
    return section.stylesheets.join("") + section.children.map(collectStyles).join("");
  }

  interface Props {
    story: Story;
    options?: TemplateOptions;
  }

  let { story, options = {} }: Props = $props();

  let messageGroups: PromptProps[][] = $state([]);
  let messageBuffer: PromptProps[] = [];

  let lastSceneRef: HTMLDivElement | null = $state(null);
  let lastFormRef: HTMLFormElement | null = $state(null);
  let lastCoverRef: HTMLDivElement | null = $state(null);

  let session: StorySession | null = null;
  let resolver: ((result: PromptResult) => void) | null = null;

  // Scroll to latest scene + play cover animation when scenes change
  $effect(() => {
    if (!messageGroups.length) {
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

  $effect(() => {
    const timer = setTimeout(() => {
      if (session) {
        return;
      }

      session = story.session();
      session.play(prompt, { adapter: "html", debug: options.debug }).then(() => {
        session = null;
        if (messageBuffer.length) {
          messageGroups.push(messageBuffer);
          messageBuffer = [];
        }
      });
      document.addEventListener("keydown", handleDocumentKeyDown);
    }, 200);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleDocumentKeyDown);
      if (resolver) {
        resolver({ type: "end" });
        resolver = null;
      }
    };
  });

  const prompt: StoryPrompt = async (message) => {
    if (!message.inputs.length && !message.navs.length) {
      if (message.text) {
        messageBuffer.push(message);
      }

      resolver = null;
      return { type: "continue" };
    }

    messageBuffer.push(message);
    messageGroups.push(messageBuffer);
    messageBuffer = [];

    return new Promise<PromptResult>((resolve) => {
      resolver = resolve;
    });
  };

  function resolveForm(form: HTMLFormElement, submitter?: HTMLElement | null) {
    if (resolver) {
      const formData = new FormData(form, submitter);
      resolver({ type: "continue", data: formData });
      resolver = null;
    }
  }

  function resolveLastForm() {
    if (!lastFormRef) {
      return;
    }

    const lastScene = messageGroups[messageGroups.length - 1];
    if (lastScene.find((message) => message.navs.length !== 0)) {
      return;
    }

    resolveForm(lastFormRef);
  }

  function handleDocumentKeyDown(ev: KeyboardEvent) {
    if (ev.key === "Enter") {
      resolveLastForm();
    }
  }

  function handlePlayerClick() {
    resolveLastForm();
  }

  function handleFormKeyDown(ev: KeyboardEvent) {
    if (ev.key === "Enter") {
      ev.preventDefault();
    }
  }

  function handleFormSubmit(ev: SubmitEvent) {
    ev.preventDefault();
    resolveForm(ev.currentTarget as HTMLFormElement, ev.submitter);
  }

  export function save() {
    return session?.save() ?? null;
  }

  export function load(data: any) {
    session?.load(data);
  }
</script>

<svelte:head>
  {#if story}
    <svelte:element this={"style"}>
      {@html collectStyles(story.root)}
    </svelte:element>
  {/if}
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div onclick={handlePlayerClick}>
  {#each messageGroups as group, i}
    {@const enabled = i === messageGroups.length - 1}
    <div
      class="scene relative px-2 pb-8 first:mt-0 border-b-2 border-red-700 last:border-none overflow-hidden
        {options.showHeader ? 'pt-12 not-md:first:pt-8' : 'pt-8 not-md:first:pt-4'}
        {!enabled ? 'opacity-50' : ''}"
      bind:this={lastSceneRef}
    >
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <form
        bind:this={lastFormRef}
        onkeydown={handleFormKeyDown}
        onsubmit={enabled ? handleFormSubmit : (ev) => ev.preventDefault()}
      >
        {#each group as message}
          {@html processHtml(message.text, !enabled)}
        {/each}
      </form>
      {#if enabled}
        <div
          class="absolute left-0 right-0 top-full h-[200%] bg-linear-to-b from-transparent via-white to-white z-10"
          bind:this={lastCoverRef}
        ></div>
      {/if}
    </div>
  {/each}
</div>
