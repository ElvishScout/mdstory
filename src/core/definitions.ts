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
export interface Asset {
  url: string;
  mime?: string;
}
/** Story metadata (front-matter). */
export interface Metadata {
  title?: string;
  author?: string;
  email?: string;
  scope?: Scope;
  assets?: Record<string, Asset>;
}

/** Base options for HTML templates */
export interface TemplateOptions {
  debug?: boolean;
}
