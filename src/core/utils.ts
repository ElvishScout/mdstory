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

async function importScriptModule(script: string) {
  const uint8 = new TextEncoder().encode(script);
  const binary = String.fromCharCode(...uint8);
  const url = "data:text/javascript;base64," + btoa(binary);
  const module = await import(/* @vite-ignore */ url);
  return module.default ?? {};
}

export function isUrl(path: string) {
  return /^https?:\/\//.test(path);
}

export async function parseScript<T>(script: string, schema: Zod.ZodType<T>): Promise<T> {
  return script.trim() ? schema.parse(await importScriptModule(script)) : ({} as T);
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
