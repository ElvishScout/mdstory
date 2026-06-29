import { DEFAULT_CHAPTER } from "./definitions.js";

function dynamicImport(specifier: string) {
  return import(/* @vite-ignore */ specifier) as Promise<any>;
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.location?.href === "string";
}

async function nodePath() {
  return isBrowser() ? null : dynamicImport("node:path");
}

async function nodeFs() {
  return isBrowser() ? null : dynamicImport("node:fs/promises");
}

function isUrl(path: string) {
  return /^https?:\/\//.test(path);
}

function getScriptModuleId(index: number, chapterId?: string | typeof DEFAULT_CHAPTER, sceneId?: string) {
  let moduleId = "story";
  if (chapterId) {
    const chapterIdStr = chapterId === DEFAULT_CHAPTER ? "" : chapterId;
    moduleId += `.chapter.${chapterIdStr}`;
  }
  if (sceneId) {
    moduleId += `.scene.${sceneId}`;
  }
  moduleId += `.index.${index}`;
  return moduleId;
}

async function importScriptModule(script: string, id?: string) {
  if (!script.trim()) {
    return {};
  }

  const uint8 = new TextEncoder().encode(script);
  const binary = String.fromCharCode(...uint8);
  const url = "data:text/javascript;charset=utf-8;base64," + btoa(binary) + (id ? `#id_${id}` : "");
  const module = await import(/* @vite-ignore */ url);
  return module.default ?? {};
}

export async function mergeScripts(scripts: string[], chapterId?: string | typeof DEFAULT_CHAPTER, sceneId?: string) {
  const modules = await Promise.all(
    scripts.map(async (script, i) => {
      const moduelId = getScriptModuleId(i, chapterId, sceneId);
      return await importScriptModule(script, moduelId);
    }),
  );
  return Object.assign({}, ...modules);
}

export async function normalizePath(path: string, base?: string) {
  if (isUrl(path)) {
    return new URL(path).toString();
  }
  if (base && isUrl(base)) {
    return new URL(path, base).toString();
  }
  if (isBrowser()) {
    return new URL(path, base ?? globalThis.location.href).toString();
  }
  const pathModule = (await nodePath())!;
  if (base) {
    const baseDir = /[/\\]$/.test(base) ? base : pathModule.dirname(base);
    return pathModule.resolve(baseDir, path);
  }
  return pathModule.resolve(path);
}

export async function loadSource(normalizedPath: string) {
  if (isUrl(normalizedPath)) {
    return await (await fetch(normalizedPath)).text();
  }
  return (await (await nodeFs())!.readFile(normalizedPath, { encoding: "utf-8" })) as string;
}

export function escapeHtml(text: string) {
  return text.replace(/[<>&'"]/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
