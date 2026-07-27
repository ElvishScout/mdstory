import path from "node:path";
import fs from "node:fs/promises";

import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

import { parseStorySource } from "../../src/index.ts";

const placeholderFile = path.resolve(__dirname, "placeholder.md");

const virtualModuleId = "virtual:placeholder-story";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

// placeholder.md 作为虚拟模块在 load 时实时解析，
// 文件变化时使模块失效并整页刷新，保证 dev 下内容始终最新
function placeholderStory(): Plugin {
  return {
    name: "placeholder-story",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const source = await fs.readFile(placeholderFile, "utf-8");
        const parsedStory = await parseStorySource(source);
        return `export default ${JSON.stringify(parsedStory)};`;
      }
    },
    configureServer(server) {
      server.watcher.add(placeholderFile);
      server.watcher.on("change", (changed) => {
        if (path.resolve(changed) === placeholderFile) {
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
          }
          server.ws.send({ type: "full-reload" });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [placeholderStory(), svelte(), tailwindcss(), viteSingleFile()],
  base: "./",
});
