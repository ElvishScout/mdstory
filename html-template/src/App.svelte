<script lang="ts">
  import { type ParsedStory, type Story, fromParsed } from "../../";
  import { unescapeHtml } from "./utils";
  import StoryPlayer from "./lib/StoryPlayer.svelte";

  const placeholderStory = __PLACEHOLDER_STORY__;

  let story: Story | undefined = $state();
  let debug = $state<boolean | undefined>(undefined);

  $effect(() => {
    const debugParam = new URLSearchParams(window.location.search).get("debug");
    if (debugParam !== null) {
      debug = debugParam === "1";
    }

    const originalTitle = document.title;

    const sourceScript = document.querySelector<HTMLScriptElement>("#parsed-story")!;
    let parsedStory = JSON.parse(unescapeHtml(sourceScript.textContent!));

    // Totally unchanged
    if (parsedStory === "__PARSED_STORY__") {
      parsedStory = placeholderStory;
    }

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
  <StoryPlayer {story} {debug} />
{/if}
