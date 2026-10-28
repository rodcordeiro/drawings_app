import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTerms, validDuration } from '../src/utils/unsplash.util.ts';

test('normalizes terms and removes case-insensitive duplicates', () => {
  assert.deepEqual(normalizeTerms([' Forest ', 'forest', 'Portrait', '']), ['Forest', 'Portrait']);
});

test('validates timer boundaries', () => {
  assert.equal(validDuration(10), true);
  assert.equal(validDuration(7200), true);
  assert.equal(validDuration(9), false);
  assert.equal(validDuration(7201), false);
  assert.equal(validDuration(NaN), false);
});
