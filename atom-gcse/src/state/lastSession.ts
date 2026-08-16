/**
 * Hand-off for the results screen.
 *
 * The summary is a structured object, and router params only carry strings, so the
 * practice screen parks it here and the results screen picks it up. It is deliberately
 * transient — nothing here needs to survive an app restart, since finished sessions are
 * already written to SQLite.
 */

import type { SessionSummary } from './usePracticeSession';

let lastSummary: SessionSummary | null = null;

export function setLastSummary(summary: SessionSummary): void {
  lastSummary = summary;
}

export function takeLastSummary(): SessionSummary | null {
  return lastSummary;
}

export function clearLastSummary(): void {
  lastSummary = null;
}
