import { Scene } from "./scene.js";
import { renderTemplate } from "./render.js";
import type { RenderOptions, RenderResult } from "./render.js";
import type { ChapterHooks, Scope, Asset, ChapterInit, DEFAULT_CHAPTER } from "./definitions.js";
import type { ParsedChapter } from "./parser.js";
import { mergeScripts } from "./utils.js";

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

  static async fromParsed(chapter: ParsedChapter) {
    return new Chapter({
      id: chapter.id,
      title: chapter.title,
      template: chapter.template,
      scenes: await Promise.all(chapter.scenes.map((scene) => Scene.fromParsed(scene, chapter.id))),
      hooks: await mergeScripts(chapter.scripts, chapter.id),
    });
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
