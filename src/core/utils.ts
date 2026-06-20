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

export function isUrl(path: string) {
  return /^https?:\/\//.test(path);
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
