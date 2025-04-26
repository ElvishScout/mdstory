import { z } from "zod";

type JsonPrimitive = number | string | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export const ValueSchema = z.any().transform((v) => v as JsonValue);
export const ScopeSchema = z.record(ValueSchema);
export const MetadataSchema = z.object({
  title: z.string().default(""),
  globals: ScopeSchema.default({}),
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
export type Metadata = z.infer<typeof MetadataSchema>;
export type StoryHooks = z.infer<typeof StoryHooksSchema>;
export type ChapterHooks = z.infer<typeof ChapterHooksSchema>;

export type ValueType = "string" | "number" | "boolean" | "object";
