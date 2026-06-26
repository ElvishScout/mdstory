import { z } from "zod";
import type { JsonValue, StoryHooks, ChapterHooks, SceneHooks } from "./definitions.js";

function PromiseLikeSchema<T extends z.ZodType>(schema: T) {
  return schema.or(schema.promise());
}

export const VariableSchema = z.any().transform((v) => v as JsonValue);
export const ScopeSchema = z.record(VariableSchema);

const AssetObjectSchema = z.object({
  url: z.string(),
  mime: z.string().optional(),
  alt: z.string().optional(),
});

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

export const StoryHooksSchema = z
  .object({
    globals: z.function().returns(PromiseLikeSchema(ScopeSchema.optional())),
    onStart: z.function(),
  })
  .partial() as z.ZodType<StoryHooks>;

export const ChapterHooksSchema = z
  .object({
    locals: z.function().returns(PromiseLikeSchema(ScopeSchema.optional())),
    onEnter: z.function(),
    onLeave: z.function(),
  })
  .partial() as z.ZodType<ChapterHooks>;

export const SceneHooksSchema = z
  .object({
    view: z.function().returns(PromiseLikeSchema(ScopeSchema.optional())),
    onEnter: z.function(),
    onLeave: z.function(),
  })
  .partial() as z.ZodType<SceneHooks>;
