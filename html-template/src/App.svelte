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
  <div class="flex flex-col items-center justify-center min-h-screen p-8">
    <div class="flex flex-col items-center max-w-md w-full space-y-6">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-4xl">📖</span>
        <h1 class="text-4xl tracking-tight">MdStory</h1>
      </div>
      <p class="text-center text-gray-800 leading-relaxed">
        Your story JSON is not yet injected. Use one of the methods below to get started.
      </p>
      <div class="w-full border border-gray-200 rounded-xl p-5 text-left space-y-4">
        <div>
          <h2 class="font-semibold text-gray-600 uppercase tracking-wider mb-2">CLI</h2>
          <p class="text-gray-800 mb-2">Build from a Markdown file:</p>
          <code class="block bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 font-mono text-gray-800">
            npx mdstory build story.md
          </code>
        </div>
        <div class="border-t border-gray-100 pt-4">
          <h2 class="font-semibold text-gray-600 uppercase tracking-wider mb-2">Manual</h2>
          <p class="text-gray-800">
            Replace <code class="bg-gray-50 px-1.5 py-0.5 rounded font-mono text-gray-800"> "__PARSED_STORY__" </code> in
            this HTML file with your parsed story JSON.
          </p>
        </div>
      </div>
      <span class="text-gray-600">Refer to the README.md in the project root for details.</span>
    </div>
  </div>
{/if}
