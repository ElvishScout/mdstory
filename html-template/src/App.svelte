<script lang="ts">
  import { type Story, fromParsed } from "../../";
  import StoryPlayer from "./lib/StoryPlayer.svelte";

  let story: Story | undefined = $state();
  let debug = $state<boolean | undefined>(undefined);

  $effect(() => {
    const debugParam = new URLSearchParams(window.location.search).get("debug");
    if (debugParam !== null) {
      debug = debugParam === "1";
    }

    const originalTitle = document.title;

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
  <StoryPlayer {story} {debug} />
{/if}
