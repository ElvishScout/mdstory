<script lang="ts">
  import { type Story, fromParsed } from "../../../src";
  import { parseKeyValuePairs } from "../../../src/core/utils";
  import StoryPlayer from "./components/StoryPlayer.svelte";
  import { deepMerge } from "./lib/utils";
  import type { TemplateOptions } from "./types";

  let story: Story | undefined = $state();
  let options: TemplateOptions | undefined = $state();

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

    return () => {
      document.title = originalTitle;
    };
  });
</script>

<div class="min-h-screen pb-[33vh] flex flex-col *:grow">
  {#if story}
    <StoryPlayer {story} {options} />
  {/if}
</div>
