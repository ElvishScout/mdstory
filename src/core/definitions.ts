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
export const StoryHooksSchema = z
  .object({
    onStart: z.function().args(z.object({ globals: ScopeSchema })),
  })
  .partial();
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

export type Variable = z.infer<typeof VariableSchema>;
export type Scope = z.infer<typeof ScopeSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type StoryHooks = z.infer<typeof StoryHooksSchema>;
export type ChapterHooks = z.infer<typeof ChapterHooksSchema>;

export type InputType = "string" | "number" | "boolean";

export type ChapterInit = {
  title: string;
  template: string;
  hooks: ChapterHooks;
};

export type StoryInit = {
  metadata: Metadata;
  chapters: Record<string, ChapterInit>;
  entry: string | null;
  stylesheet: string;
  hooks: StoryHooks;
};

export type StoryAssets = Record<string, string>;
