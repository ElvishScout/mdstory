<script lang="ts">
  import { type Story, type TemplateOptions, fromParsed } from "../../";
  import StoryPlayer from "./lib/StoryPlayer.svelte";

  let story: Story | undefined = $state();
  let options: TemplateOptions | undefined = $state();

  $effect(() => {
    const originalTitle = document.title;

    const searchParams = new URLSearchParams(location.search);
    const debugParam = searchParams.get("debug");

    const templateOptions = typeof window.TEMPLATE_OPTIONS === "string" ? {} : window.TEMPLATE_OPTIONS;
    if (debugParam !== null) {
      templateOptions.debug = debugParam === "1";
    }

    options = templateOptions;

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

{#if story}
  <StoryPlayer {story} {options} />
{/if}
