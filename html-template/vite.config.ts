import path from "node:path";
import fs from "node:fs/promises";

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

import { parseStorySource } from "../src/index.ts";

// https://vite.dev/config/
export default defineConfig(async () => {
  const source = await fs.readFile(path.resolve(__dirname, "placeholder.md"), { encoding: "utf-8" });
  const parsedStory = await parseStorySource(source);

  return {
    plugins: [svelte(), tailwindcss(), viteSingleFile()],
    base: "./",
    define: {
      __PLACEHOLDER_STORY__: JSON.stringify(parsedStory),
    },
  };
});
