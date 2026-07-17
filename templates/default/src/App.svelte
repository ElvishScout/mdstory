<script lang="ts">
  import { type Story, fromParsed } from "../../../src";
  import { parseKeyValuePairs } from "../../../src/core/utils";
  import StoryPlayer from "./components/StoryPlayer.svelte";
  import { deepMerge } from "./lib/utils";
  import type { TemplateOptions } from "./types";

  let story: Story | undefined = $state();
  let options: TemplateOptions | undefined = $state();
  let headerVisible: boolean = $state(true);

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
</script>

<div class="relative min-h-screen pb-[33vh] flex flex-col *:grow">
  {#if story}
    <div class="px-2 md:px-12">
      <StoryPlayer {story} {options} />
    </div>
    {#if options?.showHeader}
      <div
        class="fixed px-2 md:px-12 py-2 left-0 right-0 top-0 bg-white border-b-2 border-red-500 z-20 transition-transform
          {!headerVisible ? '-translate-y-full' : ''}"
      >
        <p class="text-2xl">Header</p>
      </div>
    {/if}
  {/if}
</div>
