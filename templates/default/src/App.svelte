<script lang="ts">
  import { type Story, fromParsed } from "../../../src";
  import { parseKeyValuePairs } from "../../../src/core/utils";
  import StoryPlayer from "./components/StoryPlayer.svelte";
  import { deepMerge } from "./lib/utils";
  import type { TemplateOptions } from "./types";

  let story: Story | undefined = $state();
  let options: TemplateOptions | undefined = $state();
  let headerVisible: boolean = $state(true);
  let playerRef: StoryPlayer | null = $state(null);
  let loadInputRef: HTMLInputElement | null = $state(null);

  let lastScrollY = 0;

  $effect(() => {
    const originalTitle = document.title;
    const searchParams = new URLSearchParams(location.search);

    const paramOptions = parseKeyValuePairs(searchParams.entries());
    const templateOptions = typeof window.TEMPLATE_OPTIONS === "string" ? {} : window.TEMPLATE_OPTIONS;
    options = deepMerge(templateOptions, paramOptions);

    const parsedStory = typeof window.PARSED_STORY === "string" ? window.PLACEHOLDER_STORY : window.PARSED_STORY;
    fromParsed(parsedStory).then((s) => {
      document.title = s.title;
      story = s;
    });

    window.addEventListener("scroll", handleWindowScroll);

    return () => {
      document.title = originalTitle;
      window.removeEventListener("scroll", handleWindowScroll);
    };
  });

  function handleWindowScroll() {
    const scrollY = window.scrollY;
    const offsetY = scrollY - lastScrollY;
    lastScrollY = scrollY;

    if (offsetY < 0 || scrollY < 8) {
      headerVisible = true;
    } else {
      headerVisible = false;
    }
  }

  function handleSaveClick() {
    const saved = playerRef?.save();
    if (!saved) {
      return;
    }

    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${story?.title ?? "save"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleLoadClick() {
    loadInputRef?.click();
  }

  function handleLoadFileChange(ev: Event) {
    const input = ev.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        playerRef?.load(data);
      } catch {
        // Ignore invalid save files
      }
    };
    reader.readAsText(file);
  }
</script>

<div class="relative min-h-screen pb-[33vh] flex flex-col *:grow">
  {#if story}
    <div class="px-2 md:px-12">
      <StoryPlayer {story} {options} bind:this={playerRef} />
    </div>
    {#if options?.showHeader}
      <div
        class="fixed flex px-4 md:px-14 py-2 left-0 right-0 top-0 bg-white border-b-2 border-red-700 z-20 transition-transform
          {!headerVisible ? '-translate-y-full' : ''}"
      >
        <p class="text-xl mr-auto text-nowrap overflow-hidden text-ellipsis">{story.title}</p>
        <button
          class="ml-4 text-lg text-red-600 hover:text-red-400 active:text-red-300 underline cursor-pointer"
          onclick={handleSaveClick}
        >
          Save
        </button>
        <button
          class="ml-4 text-lg text-red-600 hover:text-red-400 active:text-red-300 underline cursor-pointer"
          onclick={handleLoadClick}
        >
          Load
        </button>
        <input
          bind:this={loadInputRef}
          class="hidden"
          type="file"
          accept=".json,application/json"
          onchange={handleLoadFileChange}
        />
      </div>
    {/if}
  {/if}
</div>
