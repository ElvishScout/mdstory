import { z } from "zod";
import { contentType } from "mime-types";

import type { JsonValue, SectionHooks } from "./definitions.js";

export const VariableSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.null(), z.string(), z.number(), z.boolean(), z.array(VariableSchema), z.record(VariableSchema)]),
);
export const ScopeSchema = z.record(VariableSchema);

const AssetObjectSchema = z.object({
  url: z.string(),
  mime: z.string().optional(),
});

export const AssetSchema = z.union([
  z.string().transform((url) => {
    const extension = url.match(/\.[^./\\?#]*(?=[?#]|$)/)?.[0] ?? "";
    return AssetObjectSchema.parse({ url, mime: contentType(extension) || undefined });
  }),
  AssetObjectSchema,
]);
export const AssetsSchema = z.record(AssetSchema);
export const MetadataSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  email: z.string().optional(),
  scope: ScopeSchema.optional(),
  assets: AssetsSchema.optional(),
});

export const SectionHooksSchema = z
  .object({
    data: z.function(),
    onEnter: z.function(),
    onLeave: z.function(),
  })
  .partial() as z.ZodType<SectionHooks>;
