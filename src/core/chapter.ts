import Handlebars from "handlebars";
import type { Scene } from "./scene.js";
import { ChapterHooks, Scope, ChapterInit, DEFAULT_CHAPTER } from "./definitions.js";

/** A chapter grouping scenes with shared hooks and local variables. */
export class Chapter {
  id: string | typeof DEFAULT_CHAPTER;
  title: string;
  hooks: ChapterHooks;
  locals: Scope;
  scenes: Scene[];

  constructor({ id, title, hooks, locals, scenes }: ChapterInit) {
    this.id = id;
    this.title = title ?? "";
    this.hooks = hooks ?? {};
    this.locals = locals ?? {};
    this.scenes = scenes;
  }

  /** Renders the chapter title with Handlebars using the given scope. */
  renderTitle(scope: Scope): string {
    return Handlebars.compile(this.title)(scope);
  }

  /** Get scene by scene id */
  getScene(id: string) {
    return this.scenes.find((scene) => scene.id === id) ?? null;
  }
}
