import { mavenSchema } from "../maven/config";
import { scaffoldSchema } from "../scaffold/config";
import { sdkSchema } from "../sdk/config";
import { FieldResolver } from "./types";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

/**
 * Infers the resolved config type from a schema of FieldResolvers.
 * Each key in the schema maps to the type of its FieldResolver's default value.
 */
type ResolvedFromSchema<S> = {
  [K in keyof S]: S[K] extends FieldResolver<infer T> ? T : never;
};

/**
 * Type guard to check if an object is a FieldResolver.
 * @param obj - The object to check.
 * @returns True if the object is a FieldResolver, false otherwise.
 */
function isFieldResolver(obj: unknown): obj is FieldResolver<unknown> {
  return isPlainObject(obj) && typeof obj.env === "string" && "default" in obj;
}

/**
 * Resolves a config field value from environment, file, or default.
 * Priority: environment variable > file value > default value.
 * @param field - The FieldResolver for the config field.
 * @param fileVal - The value from the config file (if any).
 * @returns The resolved value for the field.
 */
function resolveField<T>(field: FieldResolver<T>, fileVal: unknown): T {
  const fromEnv =
    typeof process !== "undefined" ? process.env[field.env] : undefined;
  if (fromEnv !== undefined) {
    try {
      if (typeof field.default === "boolean") {
        return (fromEnv === "true") as unknown as T;
      }
      if (typeof field.default === "number") {
        return Number(fromEnv) as unknown as T;
      }
      return JSON.parse(fromEnv) as T;
    } catch {
      return fromEnv as unknown as T;
    }
  }
  return fileVal !== undefined ? (fileVal as T) : field.default;
}

/**
 * Resolves a config section from a schema and partial data.
 * @param schema - The schema describing the section's fields.
 * @param data - Partial data for the section (from file).
 * @returns The resolved config section.
 */
function resolveSection<S extends Record<string, FieldResolver<unknown>>>(
  schema: S,
  data: Partial<Record<keyof S, unknown>>
): ResolvedFromSchema<S> {
  return Object.fromEntries(
    Object.entries(schema).map(([key, resolver]) => {
      if (!isFieldResolver(resolver)) {
        throw new Error(`Invalid schema for key: ${key}`);
      }
      return [key, resolveField(resolver, data?.[key as keyof typeof data])];
    })
  ) as ResolvedFromSchema<S>;
}

/**
 * Safely extracts a config section from unknown file data.
 * @param fileData - The raw config file data.
 * @param section - The section name to extract.
 * @returns The section data as a partial object, or an empty object if not found.
 */
function getSection<T extends object>(
  fileData: unknown,
  section: string
): Partial<T> {
  if (
    typeof fileData === "object" &&
    fileData !== null &&
    section in fileData &&
    typeof (fileData as Record<string, unknown>)[section] === "object" &&
    (fileData as Record<string, unknown>)[section] !== null
  ) {
    return (fileData as Record<string, unknown>)[section] as Partial<T>;
  }
  return {};
}

/**
 * Checks if a value is a plain object (not an array, not null).
 * @param value - The value to check.
 * @returns True if the value is a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Merges two config values, recursively merging objects.
 * @param baseVal - The base value.
 * @param overrideVal - The override value.
 * @returns The merged value.
 */
function mergeValue<V>(baseVal: V, overrideVal: unknown): V {
  if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
    return mergeConfig(baseVal, overrideVal as Partial<V>);
  }
  // If overrideVal is undefined, keep baseVal; else use overrideVal
  return overrideVal === undefined ? baseVal : (overrideVal as V);
}

/**
 * Loads and resolves config synchronously from a file.
 * @param configPath - Path to the config file (default: .aemrc.json).
 * @returns The resolved config object.
 */
export function loadConfigSync(configPath = ".aemrc.json") {
  const configFilePath =
    typeof process !== "undefined"
      ? path.resolve(process.cwd(), configPath)
      : "";
  const fileData: unknown =
    configFilePath && fs.existsSync(configFilePath)
      ? JSON.parse(fs.readFileSync(configFilePath, "utf-8"))
      : {};

  return resolveSchema(fileData);
}

/**
 * Loads and resolves config asynchronously from a file.
 * @param configPath - Path to the config file (default: .aemrc.json).
 * @returns The resolved config object (Promise).
 */
export async function loadConfigAsync(configPath = ".aemrc.json") {
  const configFilePath =
    typeof process !== "undefined"
      ? path.resolve(process.cwd(), configPath)
      : "";
  let fileData: unknown = {};
  if (configFilePath) {
    try {
      const content = await fsPromises.readFile(configFilePath, "utf-8");
      fileData = JSON.parse(content);
    } catch {
      // ignore missing file
    }
  }
  return resolveSchema(fileData);
}

/**
 * Deeply merges two config objects.
 * @param base - The base config object.
 * @param override - The override config object.
 * @returns The merged config object.
 */
export function mergeConfig<T>(base: T, override: Partial<T>): T {
  if (!override) {
    return base;
  }
  const result = { ...base };

  (Object.keys(override) as Array<keyof T>).forEach((key) => {
    result[key] = mergeValue(base[key], override[key]);
  });

  return result;
}

/**
 * Resolves the full config schema from raw file data.
 * @param fileData - The raw config file data.
 * @returns The resolved config object.
 */
export function resolveSchema(fileData: unknown) {
  return {
    maven: resolveSection(mavenSchema, getSection(fileData, "maven")),
    scaffold: resolveSection(scaffoldSchema, getSection(fileData, "scaffold")),
    sdk: resolveSection(sdkSchema, getSection(fileData, "sdk")),
  };
}

/**
 * The config schema for all supported sections (maven, scaffold, sdk).
 * Useful for introspection and testing.
 */
export const configSchema = {
  maven: mavenSchema,
  scaffold: scaffoldSchema,
  sdk: sdkSchema,
};

/**
 * The inferred type for the resolved config object.
 */
export type ResolvedConfig = {
  maven: ResolvedFromSchema<typeof mavenSchema>;
  scaffold: ResolvedFromSchema<typeof scaffoldSchema>;
  sdk: ResolvedFromSchema<typeof sdkSchema>;
};
