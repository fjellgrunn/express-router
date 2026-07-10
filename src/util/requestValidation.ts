/**
 * Request validation helpers for list/query/facet/action routes.
 *
 * These functions provide lightweight, consistent validation feedback
 * for common request inputs. They return structured error objects
 * (or `null` on success) so callers can respond with 400 without
 * duplicating boilerplate.
 */

export type ValidationError = {
  error: string;
  field: string;
};

/**
 * Validate that a finder name is a non-empty, alphanumeric string
 * (underscores and hyphens allowed).
 *
 * @returns ValidationError if invalid, null if valid.
 */
export function validateFinderName(finder: unknown): ValidationError | null {
  if (finder === undefined || finder === null || finder === '') {
    return null; // No finder is valid — means a regular query
  }
  if (typeof finder !== 'string') {
    return { error: 'Invalid finder: expected a string', field: 'finder' };
  }
  if (finder.trim().length === 0) {
    return { error: 'Invalid finder: must not be empty', field: 'finder' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(finder.trim())) {
    return { error: 'Invalid finder: only alphanumeric, hyphen, and underscore characters are allowed', field: 'finder' };
  }
  return null;
}

/**
 * Validate the `one` query parameter.
 * It must be either 'true' or 'false' (or absent).
 *
 * @returns ValidationError if invalid, null if valid.
 */
export function validateOneParam(one: unknown): ValidationError | null {
  if (one === undefined || one === null || one === '') {
    return null;
  }
  if (typeof one !== 'string') {
    return { error: 'Invalid one: expected a string value', field: 'one' };
  }
  if (one !== 'true' && one !== 'false') {
    return { error: 'Invalid one: must be "true" or "false"', field: 'one' };
  }
  return null;
}

/**
 * Validate a facet or action key extracted from the request path.
 * The key must be a non-empty string.
 *
 * @returns ValidationError if invalid, null if valid.
 */
export function validateFacetOrActionKey(key: string): ValidationError | null {
  if (!key || key.trim().length === 0) {
    return { error: 'Missing facet or action key in path', field: 'path' };
  }
  return null;
}

/**
 * Validate that a request body is present and is an object (not null, undefined, or a primitive).
 *
 * @returns ValidationError if invalid, null if valid.
 */
export function validateRequestBody(body: unknown): ValidationError | null {
  if (body === undefined || body === null) {
    return { error: 'Request body is required', field: 'body' };
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object', field: 'body' };
  }
  return null;
}
