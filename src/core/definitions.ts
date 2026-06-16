import { z } from "zod";
import type { Chapter } from "./chapter.js";
import type { Scene } from "./scene.js";

type JsonPrimitive = number | string | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonArray | JsonObject;

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

/** Story-level lifecycle hooks. */
export const StoryHooksSchema = z
  .object({
    globals: z.function().returns(PromiseLikeSchema(ScopeSchema.optional())),
    onStart: z.function(),
  })
  .partial();

/** Chapter-level lifecycle hooks. */
export const ChapterHooksSchema = z
  .object({
    locals: z.function().returns(PromiseLikeSchema(ScopeSchema.optional())),
    onEnter: z.function(),
    onLeave: z.function(),
  })
  .partial();

/** Scene-level lifecycle hooks. */
export const SceneHooksSchema = z
  .object({
    data: z.function().returns(PromiseLikeSchema(ScopeSchema.optional())),
    onEnter: z.function(),
    onLeave: z.function(),
  })
  .partial();

/** All JSON-compatible values. */
export type Variable = z.infer<typeof VariableSchema>;
/** An object of variable values by their names. */
export type Scope = z.infer<typeof ScopeSchema>;
/** A referenceable resource file. */
export type Asset = z.infer<typeof AssetSchema>;
/** Story metadata. */
export type Metadata = z.infer<typeof MetadataSchema>;
/** Story-level lifecycle hooks. */
export type StoryHooks = z.infer<typeof StoryHooksSchema>;
/** Chapter-level lifecycle hooks. */
export type ChapterHooks = z.infer<typeof ChapterHooksSchema>;
/** Scene-level lifecycle hooks. */
export type SceneHooks = z.infer<typeof SceneHooksSchema>;

/** Symbol key for the implicit default chapter holding orphan scenes. */
export const DEFAULT_CHAPTER = Symbol("default");

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
  id: string | symbol;
  title?: string;
  hooks?: ChapterHooks;
  locals?: Scope;
  scenes: Record<string, Scene>;
  entry?: string | null;
};

/** Structured representation of the full story. */
export type StoryInit = {
  metadata?: Metadata;
  title?: string;
  chapters: Record<string | symbol, Chapter>;
  entry?: string | symbol | null;
  stylesheet?: string;
  hooks?: StoryHooks;
};
