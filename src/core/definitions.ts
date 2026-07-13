import type { Section } from "./section.js";

type JsonPrimitive = number | string | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export type { JsonValue };

/** All JSON-compatible values. */
export type Variable = JsonValue;
/** An object of variable values by their names. */
export type Scope = JsonObject;
/** A referenceable resource file. */
export type Asset = {
  url: string;
  mime?: string;
};
/** Story metadata (front-matter). */
export type Metadata = {
  title?: string;
  author?: string;
  email?: string;
  scope?: Scope;
  assets?: Record<string, Asset>;
};

type HookResult<T = void> = T | Promise<T>;

export type HookContext = {
  scope: Scope;
};

export type LeaveHookContext = HookContext & {
  target: string | null;
};

/** Type indicator for input fields. */
export type InputType = "string" | "number" | "boolean";

/** Section-level lifecycle hooks — unified, no globals/locals distinction. */
export type SectionHooks = {
  /** Returns variables that take effect within this section's scope and cascade to descendants. */
  scope?: (context: HookContext) => HookResult<Scope | undefined>;
  onEnter?: (context: HookContext) => HookResult;
  onLeave?: (context: LeaveHookContext) => HookResult;
};

/** Structured representation of a section for runtime construction. */
export type SectionInit = {
  id: string;
  title?: string;
  template?: string;
  stylesheets?: string[];
  hooks?: SectionHooks;
  children: Section[];
};

/** Base options for HTML templates */
export type TemplateOptions = {
  debug?: boolean;
};
