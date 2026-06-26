import type { Chapter } from "./chapter.js";
import type { Scene } from "./scene.js";

type JsonPrimitive = number | string | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonArray | JsonObject;
type HookResult<T = void> = T | Promise<T>;

export type { JsonValue };

/** All JSON-compatible values. */
export type Variable = JsonValue;
/** An object of variable values by their names. */
export type Scope = JsonObject;
/** A referenceable resource file. */
export type Asset = {
  url: string;
  mime?: string;
  alt?: string;
};
/** Story metadata. */
export type Metadata = {
  title?: string;
  author?: string;
  email?: string;
  globals?: Scope;
  assets?: Record<string, Asset>;
};

export type HookContext = {
  globals: Scope;
  locals: Scope;
};

export type StoryHookContext = Pick<HookContext, "globals">;
export type LeaveHookContext = HookContext & {
  target: string | null;
};

/** Type indicator for input fields. */
export type InputType = "string" | "number" | "boolean";

/** Story-level lifecycle hooks. */
export type StoryHooks = {
  globals?: () => HookResult<Scope | undefined>;
  onStart?: (context: StoryHookContext) => HookResult;
};

/** Chapter-level lifecycle hooks. */
export type ChapterHooks = {
  locals?: (context: StoryHookContext) => HookResult<Scope | undefined>;
  onEnter?: (context: HookContext) => HookResult;
  onLeave?: (context: LeaveHookContext) => HookResult;
};

/** Scene-level lifecycle hooks. */
export type SceneHooks = {
  view?: (context: HookContext) => HookResult<Scope | undefined>;
  onEnter?: (context: HookContext) => HookResult;
  onLeave?: (context: LeaveHookContext) => HookResult;
};

/** Symbol key for the implicit default chapter holding orphan scenes. */
export const DEFAULT_CHAPTER = Symbol("default");

/** Structured representation of a scene's content. */
export type SceneInit = {
  id: string;
  title?: string;
  template: string;
  hooks?: SceneHooks;
};

/** Structured representation of a chapter. */
export type ChapterInit = {
  id: string | typeof DEFAULT_CHAPTER;
  title?: string;
  template?: string;
  hooks?: ChapterHooks;
  locals?: Scope;
  scenes: Scene[];
};

/** Structured representation of the full story. */
export type StoryInit = {
  metadata?: Metadata;
  title?: string;
  template?: string;
  chapters: Chapter[];
  stylesheet?: string;
  hooks?: StoryHooks;
  debug?: boolean;
};
