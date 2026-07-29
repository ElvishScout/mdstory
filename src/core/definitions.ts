/** JSON primitive types. */
export type JsonPrimitive = number | string | boolean | null;
/** JSON array type. */
export interface JsonArray extends Array<JsonValue> {}
/** JSON object type. */
export interface JsonObject {
  [key: string]: JsonValue;
}
/** Any JSON-serializable value. */
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/** An object of variable values by their names. */
export type Scope = Record<string, any>;

/**
 * Host-provided environment objects made available to section hooks during
 * playback. Supplied via `PlayOptions.env`; hooks may read and mutate it
 * freely, e.g. to access player services or attach external state.
 */
export type Env = Record<string, any>;

/** A referenceable resource file. */
export interface Asset {
  /** URL of the resource. */
  url: string;
  /** MIME type of the resource, if known. */
  mime?: string;
}

/** Story metadata (front-matter). */
export interface Metadata {
  /** Story title. */
  title?: string;
  /** Author name. */
  author?: string;
  /** Author contact email. */
  email?: string;
  /** Initial variables available in the root scope. */
  scope?: Scope;
  /** Named assets available to templates during rendering. */
  assets?: Record<string, Asset>;
}

/** Base options for HTML templates */
export interface TemplateOptions {
  /** Enable debug mode in the generated output. */
  debug?: boolean;
}
