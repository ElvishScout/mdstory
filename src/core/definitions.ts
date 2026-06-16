import { z } from "zod";

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

const TargetSchema = z.string().or(z.null());
/**
 * Story-level lifecycle hooks.
 * - `onStart`: Called when the story starts, receives initial globals.
 */
export const StoryHooksSchema = z
  .object({
    onStart: z.function().args(z.object({ globals: ScopeSchema })),
  })
  .partial();
/**
 * Chapter-level lifecycle hooks.
 * - `onEnter`: Called when entering a chapter. Return `{ data }` to merge into the render context.
 * - `onLeave`: Called when leaving a chapter. Return `{ target }` to override navigation.
 */
export const ChapterHooksSchema = z
  .object({
    onEnter: z
      .function()
      .args(z.object({ globals: ScopeSchema }))
      .returns(PromiseLikeSchema(z.object({ data: ScopeSchema }).partial().optional())),
    onLeave: z
      .function()
      .args(z.object({ globals: ScopeSchema, updates: ScopeSchema, target: TargetSchema }))
      .returns(PromiseLikeSchema(z.object({ target: TargetSchema }).partial().optional())),
  })
  .partial();

/** All JSON-compatible values: primitives, arrays, and objects. */
export type Variable = z.infer<typeof VariableSchema>;

/** An object of variable values by their names, used for globals or input fields. */
export type Scope = z.infer<typeof ScopeSchema>;

/**
 * A referenceable resource file.
 * @property url - The URL of the resource.
 * @property mime - The MIME type of the resource.
 * @property alt - The alternative text of the resource.
 */
export type Asset = z.infer<typeof AssetSchema>;

/** Story metadata including title, author, globals, and assets. */
export type Metadata = z.infer<typeof MetadataSchema>;

/** Global lifecycle hooks for the story. */
export type StoryHooks = z.infer<typeof StoryHooksSchema>;

/** Lifecycle hooks for a chapter: onEnter and onLeave. */
export type ChapterHooks = z.infer<typeof ChapterHooksSchema>;

/** Type indicator for input fields: "string", "number", or "boolean". */
export type InputType = "string" | "number" | "boolean";

/** Structured representation of a chapter's content. */
export type ChapterInit = {
  /** The chapter title. */
  title: string;
  /** The Handlebars template for rendering. */
  template: string;
  /** Lifecycle hooks for the chapter. */
  hooks: ChapterHooks;
};

/** Structured representation of the full story content. */
export type StoryInit = {
  /** Story metadata (title, author, assets, etc.). */
  metadata: Metadata;
  /** Chapters keyed by their id. */
  chapters: Record<string, ChapterInit>;
  /** The id of the entry chapter, or null. */
  entry: string | null;
  /** Global CSS stylesheet content. */
  stylesheet: string;
  /** Global story lifecycle hooks. */
  hooks: StoryHooks;
};
