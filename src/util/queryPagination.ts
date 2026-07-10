/**
 * Shared pagination / query-limit helpers for list and finder routes.
 * Enforces a default and maximum row limit so unbounded queries cannot DoS the server.
 */

export interface QueryLimitsPolicy {
  defaultLimit: number;
  maxLimit: number;
}

export const DEFAULT_QUERY_LIMITS: QueryLimitsPolicy = {
  defaultLimit: 100,
  maxLimit: 100,
};

export type PaginationSuccess = {
  ok: true;
  limit: number;
  offset: number;
};

export type PaginationFailure = {
  ok: false;
  error: string;
  field: 'limit' | 'offset';
};

export type PaginationResult = PaginationSuccess | PaginationFailure;

/** Meta query keys that are routing/pagination controls, not ItemQuery fields. */
export const QUERY_META_KEYS = [
  'limit',
  'offset',
  'finder',
  'finderParams',
  'one',
] as const;

export function resolveQueryLimits(
  options?: { defaultLimit?: number; maxLimit?: number }
): QueryLimitsPolicy {
  const defaultLimit = options?.defaultLimit ?? DEFAULT_QUERY_LIMITS.defaultLimit;
  const maxLimit = options?.maxLimit ?? DEFAULT_QUERY_LIMITS.maxLimit;
  return {
    defaultLimit: Math.max(1, defaultLimit),
    maxLimit: Math.max(1, Math.max(defaultLimit, maxLimit)),
  };
}

function coerceSingleValue(value: unknown): string | void {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  // Express may produce string[] for duplicate keys — reject rather than silently pick one
  return;
}

function parseNonNegativeInt(
  raw: unknown,
  field: 'limit' | 'offset'
): { ok: true; value: number | void } | { ok: false; error: string; field: 'limit' | 'offset' } {
  if (raw === void 0 || raw === null || raw === '') {
    return { ok: true, value: void 0 };
  }

  if (Array.isArray(raw)) {
    return {
      ok: false,
      error: `Invalid ${field}: multiple values are not allowed`,
      field,
    };
  }

  const asString = coerceSingleValue(raw);
  if (asString === void 0) {
    return {
      ok: false,
      error: `Invalid ${field}: expected a non-negative integer`,
      field,
    };
  }

  const trimmed = asString.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: void 0 };
  }

  // Reject non-integer strings (e.g. "10.5", "abc")
  if (!/^\d+$/.test(trimmed)) {
    return {
      ok: false,
      error: `Invalid ${field}: expected a non-negative integer`,
      field,
    };
  }

  const parsed = parseInt(trimmed, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return {
      ok: false,
      error: `Invalid ${field}: expected a non-negative integer`,
      field,
    };
  }

  return { ok: true, value: parsed };
}

/**
 * Resolve limit/offset from raw Express query values.
 * - Missing limit → defaultLimit
 * - Limit above maxLimit → capped to maxLimit
 * - Limit of 0 or invalid → error
 * - Missing offset → 0
 */
export function resolvePagination(
  rawLimit: unknown,
  rawOffset: unknown,
  policy: QueryLimitsPolicy = DEFAULT_QUERY_LIMITS
): PaginationResult {
  const limitParsed = parseNonNegativeInt(rawLimit, 'limit');
  if (!limitParsed.ok) {
    return limitParsed;
  }

  const offsetParsed = parseNonNegativeInt(rawOffset, 'offset');
  if (!offsetParsed.ok) {
    return offsetParsed;
  }

  let limit = limitParsed.value ?? policy.defaultLimit;
  if (limit < 1) {
    return {
      ok: false,
      error: 'Invalid limit: must be a positive integer (>= 1)',
      field: 'limit',
    };
  }
  if (limit > policy.maxLimit) {
    limit = policy.maxLimit;
  }

  const offset = offsetParsed.value ?? 0;

  return { ok: true, limit, offset };
}

/**
 * Strip pagination/finder meta keys before building an ItemQuery.
 */
export function stripQueryMetaParams(
  query: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...query };
  for (const key of QUERY_META_KEYS) {
    delete result[key];
  }
  return result;
}
