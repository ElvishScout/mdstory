import { SceneHooks, Scope, Asset, SceneInit } from "./definitions.js";
import { renderTemplate, RenderOptions, RenderResult } from "./render.js";

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
