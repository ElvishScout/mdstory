import { z } from "zod";

type JsonPrimitive = number | string | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export const ValueSchema = z.any().transform((v) => v as JsonValue);
export const ScopeSchema = z.record(ValueSchema);

const AssetObjectSchema = z.object({ url: z.string(), mime: z.string().optional() });

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
    onStart: z.function().args(ScopeSchema).returns(ScopeSchema.or(z.void())),
  })
  .partial();
export const ChapterHooksSchema = z
  .object({
    onEnter: z.function().args(ScopeSchema).returns(ScopeSchema.or(z.void())),
    onLeave: z.function().args(ScopeSchema, ScopeSchema).returns(ScopeSchema.or(z.void())),
    onNavigate: z.function().args(TargetSchema, ScopeSchema, ScopeSchema).returns(TargetSchema.or(z.void())),
  })
  .partial();

export type Value = z.infer<typeof ValueSchema>;
export type Scope = z.infer<typeof ScopeSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type StoryHooks = z.infer<typeof StoryHooksSchema>;
export type ChapterHooks = z.infer<typeof ChapterHooksSchema>;

export type ValueType = "string" | "number" | "boolean" | "object";

export type ChapterBody = {
  title: string;
  template: string;
  script: string;
};

export type StoryBody = {
  metadata: Metadata;
  chapters: Record<string, ChapterBody>;
  entry: string | null;
  script: string;
  stylesheet: string;
};

export type StoryAssets = Record<string, string>;
