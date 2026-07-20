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
