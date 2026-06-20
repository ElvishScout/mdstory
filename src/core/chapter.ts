import type { Scene } from "./scene.js";
import { renderTemplate, RenderOptions, RenderResult } from "./render.js";
import { ChapterHooks, Scope, Asset, ChapterInit, DEFAULT_CHAPTER } from "./definitions.js";

/** A chapter grouping scenes with shared hooks and local variables. */
export class Chapter {
  id: string | typeof DEFAULT_CHAPTER;
  title: string;
  template: string;
  hooks: ChapterHooks;
  locals: Scope;
  scenes: Scene[];

  constructor({ id, title, template, hooks, locals, scenes }: ChapterInit) {
    this.id = id;
    this.title = title ?? "";
    this.template = template ?? "";
    this.hooks = hooks ?? {};
    this.locals = locals ?? {};
    this.scenes = scenes;
  }

  /** Renders the chapter template with the given scope and render options. */
  render(scope: Scope, assets: Record<string, Asset>, options: RenderOptions): RenderResult {
    return renderTemplate(this.template, scope, assets, options);
  }

  /** Get scene by scene id */
  getScene(id: string) {
    return this.scenes.find((scene) => scene.id === id) ?? null;
  }
}
