import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { db } from './data/db';

beforeEach(async () => {
  await db.amis.clear();
  await db.echanges.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
