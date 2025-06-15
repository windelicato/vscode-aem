/**
 * FieldResolver describes a config field's env var, default, and description.
 */
export interface FieldResolver<T> {
  env: string;
  default: T;
  description?: string;
}
