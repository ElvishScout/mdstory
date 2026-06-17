import Handlebars from "handlebars";
import type { Scene } from "./scene.js";
import { ChapterHooks, Scope, ChapterInit } from "./definitions.js";

/** A chapter grouping scenes with shared hooks and local variables. */
export class Chapter {
  id: string | symbol;
  title: string;
  hooks: ChapterHooks;
  locals: Scope;
  scenes: Record<string, Scene>;
  entry: Scene | null;

  constructor({ id, title, hooks, locals, scenes, entry }: ChapterInit) {
    this.id = id;
    this.title = title ?? "";
    this.hooks = hooks ?? {};
    this.locals = locals ?? {};
    this.scenes = scenes;
    this.entry = entry ? (scenes[entry] ?? null) : null;
  }

  /** Renders the chapter title with Handlebars using the given scope. */
  renderTitle(scope: Scope): string {
    return Handlebars.compile(this.title)(scope);
  }
}
