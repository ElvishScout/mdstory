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

function getScriptModuleId(index: number, sectionPath?: string[]) {
  let moduleId = "section";
  if (sectionPath && sectionPath.length) {
    moduleId += `.${sectionPath.join(".")}`;
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

export async function mergeScripts(scripts: string[], sectionPath?: string[]) {
  const modules = await Promise.all(
    scripts.map(async (script, i) => {
      const moduleId = getScriptModuleId(i, sectionPath);
      return await importScriptModule(script, moduleId);
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
  return (await (await nodeFs())!.readFile(normalizedPath, "utf-8")) as string;
}

export function escapeHtml(text: string) {
  return text.replace(/[<>&'"]/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

export class StableIdGenerator {
  counter: number;
  increment: number;
  used = new Set<string>();

  constructor(init?: number, increment?: number) {
    this.counter = init ?? 0;
    this.increment = increment ?? 1;
  }

  reserve(id: string) {
    this.used.add(id);
  }

  next() {
    let id: string;

    do {
      id = `id_${this.counter}`;
      this.counter += this.increment;
    } while (this.used.has(id));

    this.used.add(id);
    return id;
  }
}
