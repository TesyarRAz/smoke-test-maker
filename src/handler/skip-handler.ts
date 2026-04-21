import type { HurlEntry } from '../types/hurl.js';

export function shouldSkipOutput(entry: HurlEntry): boolean {
  return entry.skip === true;
}

export function getSkippedEntries(entries: HurlEntry[]): number[] {
  return entries
    .filter(e => e.skip)
    .map(e => e.index);
}

export function filterNonSkippedEntries(entries: HurlEntry[]): HurlEntry[] {
  return entries.filter(e => !e.skip);
}
