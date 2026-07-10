import { describe, expect, it } from 'vitest';
import {
  DEFAULT_QUERY_LIMITS,
  resolvePagination,
  resolveQueryLimits,
  stripQueryMetaParams,
} from '../src/util/queryPagination';

describe('queryPagination', () => {
  it('applies default limit and zero offset when omitted', () => {
    const result = resolvePagination(undefined, undefined, DEFAULT_QUERY_LIMITS);
    expect(result).toEqual({ ok: true, limit: 100, offset: 0 });
  });

  it('caps limit at maxLimit', () => {
    const result = resolvePagination('500', '0', { defaultLimit: 100, maxLimit: 100 });
    expect(result).toEqual({ ok: true, limit: 100, offset: 0 });
  });

  it('rejects invalid limit', () => {
    const result = resolvePagination('abc', undefined, DEFAULT_QUERY_LIMITS);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe('limit');
    }
  });

  it('rejects limit of zero', () => {
    const result = resolvePagination('0', undefined, DEFAULT_QUERY_LIMITS);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe('limit');
    }
  });

  it('rejects negative offset', () => {
    const result = resolvePagination('10', '-1', DEFAULT_QUERY_LIMITS);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe('offset');
    }
  });

  it('strips meta query keys', () => {
    expect(stripQueryMetaParams({
      limit: '10',
      offset: '0',
      finder: 'x',
      finderParams: '{}',
      one: 'true',
      name: 'alice',
    })).toEqual({ name: 'alice' });
  });

  it('resolves custom query limits', () => {
    expect(resolveQueryLimits({ defaultLimit: 25, maxLimit: 50 })).toEqual({
      defaultLimit: 25,
      maxLimit: 50,
    });
  });
});
