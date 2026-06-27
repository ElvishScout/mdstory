<script lang="ts">
  import { type Story, fromParsed } from "../../";
  import { unescapeHtml } from "./utils";
  import StoryPlayer from "./lib/StoryPlayer.svelte";

  let story: Story | undefined = $state();
  let showPlaceholder = $state(false);
  let debug = $state<boolean | undefined>(undefined);

  $effect(() => {
    const debugParam = new URLSearchParams(window.location.search).get("debug");
    if (debugParam !== null) {
      debug = debugParam === "1";
    }

    const originalTitle = document.title;

    const sourceScript = document.querySelector<HTMLScriptElement>("#parsed-story")!;
    const parsedStory = JSON.parse(unescapeHtml(sourceScript.textContent!));

    // Totally unchanged
    if (parsedStory === "__PARSED_STORY__") {
      showPlaceholder = true;
    } else {
      fromParsed(parsedStory).then((s) => {
        document.title = s.title;
        story = s;
      });
    }

    return () => {
      document.title = originalTitle;
    };
  });
</script>

{#if story}
  <StoryPlayer {story} {debug} />
{:else if showPlaceholder}
  <div class="relative h-screen p-8 flex flex-col items-center before:grow-3 after:grow-4">
    <div class="w-full max-w-md flex flex-col items-center">
      <h1 class="mb-4 text-4xl">📖 MdStory</h1>
      <p class="mb-4 text-center">Your story JSON is not yet injected. Use one of the methods below to get started.</p>
      <div class="mb-4 w-full border border-red-300 rounded-xl p-5 text-left space-y-4">
        <div>
          <h2 class="font-semibold text-red-700 mb-2">CLI</h2>
          <p class="mb-2">Build from a Markdown file:</p>
          <code class="block bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 font-mono">
            npx mdstory build story.md
          </code>
        </div>
        <div class="border-t border-red-200 pt-4">
          <h2 class="font-semibold text-red-700 mb-2">Manual</h2>
          <p>
            Replace <code class="bg-red-50 px-1.5 py-0.5 rounded font-mono"> "__PARSED_STORY__" </code> in this HTML file
            with your parsed story JSON.
          </p>
        </div>
      </div>
      <p class="text-center">Refer to the README.md in the project root for details.</p>
    </div>
  </div>
{/if}
