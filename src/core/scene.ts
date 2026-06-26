import type { SceneHooks, Scope, Asset, SceneInit, DEFAULT_CHAPTER } from "./definitions.js";
import type { ParsedScene } from "./parser.js";
import { renderTemplate } from "./render.js";
import type { RenderOptions, RenderResult } from "./render.js";
import { getScriptModuleId, importScriptModule } from "./utils.js";

export type { RenderOptions, RenderResult };

/** Defines a scene with a Handlebars template and lifecycle hooks. */
export class Scene {
  id: string;
  title: string;
  template: string;
  hooks: SceneHooks;

  constructor({ id, title, template, hooks }: SceneInit) {
    this.id = id;
    this.title = title ?? "";
    this.template = template;
    this.hooks = hooks ?? {};
  }

  static async fromParsed(scene: ParsedScene, chapterId: string | typeof DEFAULT_CHAPTER) {
    return new Scene({
      id: scene.id,
      title: scene.title,
      template: scene.template,
      hooks: await importScriptModule(scene.script, getScriptModuleId(chapterId, scene.id)),
    });
  }

  /**
   * Renders the scene content using the given scope and render options.
   * @param scope - Variables available to the Handlebars template.
   * @param assets - Asset objects keyed by name.
   * @param options - Rendering options (format, html).
   */
  render(scope: Scope, assets: Record<string, Asset>, options: RenderOptions): RenderResult {
    return renderTemplate(this.template, scope, assets, options);
  }
}
