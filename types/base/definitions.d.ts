import { z } from "zod";
type JsonPrimitive = number | string | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = {
    [key: string]: JsonValue;
};
type JsonValue = JsonPrimitive | JsonArray | JsonObject;
export declare const ValueSchema: z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>;
export declare const ScopeSchema: z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>>;
export declare const MetadataSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    globals: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    globals: Record<string, string | number | boolean | JsonArray | JsonObject | null>;
}, {
    title?: string | undefined;
    globals?: Record<string, any> | undefined;
}>;
export declare const StoryHooksSchema: z.ZodObject<{
    onStart: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>>], z.ZodUnknown>, z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>>, z.ZodVoid]>>>;
}, "strip", z.ZodTypeAny, {
    onStart?: ((args_0: Record<string, any>, ...args: unknown[]) => void | Record<string, string | number | boolean | JsonArray | JsonObject | null>) | undefined;
}, {
    onStart?: ((args_0: Record<string, string | number | boolean | JsonArray | JsonObject | null>, ...args: unknown[]) => void | Record<string, any>) | undefined;
}>;
export declare const ChapterHooksSchema: z.ZodObject<{
    onEnter: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>>], z.ZodUnknown>, z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>>, z.ZodVoid]>>>;
    onLeave: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>>, z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>>], z.ZodUnknown>, z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>>, z.ZodVoid]>>>;
    onNavigate: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodUnion<[z.ZodString, z.ZodNull]>, z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>>, z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodAny, string | number | boolean | JsonArray | JsonObject | null, any>>], z.ZodUnknown>, z.ZodUnion<[z.ZodUnion<[z.ZodString, z.ZodNull]>, z.ZodVoid]>>>;
}, "strip", z.ZodTypeAny, {
    onEnter?: ((args_0: Record<string, any>, ...args: unknown[]) => void | Record<string, string | number | boolean | JsonArray | JsonObject | null>) | undefined;
    onLeave?: ((args_0: Record<string, any>, args_1: Record<string, any>, ...args: unknown[]) => void | Record<string, string | number | boolean | JsonArray | JsonObject | null>) | undefined;
    onNavigate?: ((args_0: string | null, args_1: Record<string, any>, args_2: Record<string, any>, ...args: unknown[]) => string | void | null) | undefined;
}, {
    onEnter?: ((args_0: Record<string, string | number | boolean | JsonArray | JsonObject | null>, ...args: unknown[]) => void | Record<string, any>) | undefined;
    onLeave?: ((args_0: Record<string, string | number | boolean | JsonArray | JsonObject | null>, args_1: Record<string, string | number | boolean | JsonArray | JsonObject | null>, ...args: unknown[]) => void | Record<string, any>) | undefined;
    onNavigate?: ((args_0: string | null, args_1: Record<string, string | number | boolean | JsonArray | JsonObject | null>, args_2: Record<string, string | number | boolean | JsonArray | JsonObject | null>, ...args: unknown[]) => string | void | null) | undefined;
}>;
export type Value = z.infer<typeof ValueSchema>;
export type Scope = z.infer<typeof ScopeSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type StoryHooks = z.infer<typeof StoryHooksSchema>;
export type ChapterHooks = z.infer<typeof ChapterHooksSchema>;
export type ValueType = "string" | "number" | "boolean" | "object";
export {};
