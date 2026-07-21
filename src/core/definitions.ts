/** JSON types */
export type JsonPrimitive = number | string | boolean | null;
export interface JsonArray extends Array<JsonValue> {}
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/** An object of variable values by their names. */
export type Scope = Record<string, any>;

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
