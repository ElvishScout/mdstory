import { z } from "zod";
import type { Chapter } from "./chapter.js";
import type { Scene } from "./scene.js";

type JsonPrimitive = number | string | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonArray | JsonObject;
type HookResult<T = void> = T | Promise<T>;

function PromiseLikeSchema<T extends z.ZodType>(schema: T) {
  return schema.or(schema.promise());
}

export const VariableSchema = z.any().transform((v) => v as JsonValue);
export const ScopeSchema = z.record(VariableSchema);

const AssetObjectSchema = z.object({ url: z.string(), mime: z.string().optional(), alt: z.string().optional() });

export const AssetSchema = z.union([
  z.string().transform((url) => AssetObjectSchema.parse({ url, mime: undefined })),
  AssetObjectSchema,
]);
export const AssetsSchema = z.record(AssetSchema);
export const MetadataSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  email: z.string().optional(),
  globals: ScopeSchema.optional(),
  assets: AssetsSchema.optional(),
});

export type HookContext = {
  globals: Scope;
  locals: Scope;
};

export type StoryHookContext = Pick<HookContext, "globals">;
export type LeaveHookContext = HookContext & {
  target: string | null;
};

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

/** Story-level lifecycle hooks. */
export const StoryHooksSchema = z
  .object({
    globals: z.function().returns(PromiseLikeSchema(ScopeSchema.optional())),
    onStart: z.function(),
  })
  .partial() as z.ZodType<StoryHooks>;

/** Chapter-level lifecycle hooks. */
export const ChapterHooksSchema = z
  .object({
    locals: z.function().returns(PromiseLikeSchema(ScopeSchema.optional())),
    onEnter: z.function(),
    onLeave: z.function(),
  })
  .partial() as z.ZodType<ChapterHooks>;

/** Scene-level lifecycle hooks. */
export const SceneHooksSchema = z
  .object({
    view: z.function().returns(PromiseLikeSchema(ScopeSchema.optional())),
    onEnter: z.function(),
    onLeave: z.function(),
  })
  .partial() as z.ZodType<SceneHooks>;

/** Symbol key for the implicit default chapter holding orphan scenes. */
export const DEFAULT_CHAPTER = Symbol("default");

/** All JSON-compatible values. */
export type Variable = z.infer<typeof VariableSchema>;
/** An object of variable values by their names. */
export type Scope = z.infer<typeof ScopeSchema>;
/** A referenceable resource file. */
export type Asset = z.infer<typeof AssetSchema>;
/** Story metadata. */
export type Metadata = z.infer<typeof MetadataSchema>;

/** Type indicator for input fields. */
export type InputType = "string" | "number" | "boolean";

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
};
