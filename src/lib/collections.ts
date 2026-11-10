/**
 * Collection helpers (pure, unit tested). They use Map/Set so grouping and de-duplication are O(n)
 * instead of O(n²).
 */

/** Keeps the first item of each key, in the original order. */
export function uniqueBy<T>(items: readonly T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Groups by key keeping the order in which keys and items appear. */
export function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group) group.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

/** Counts how many times each key appears. */
export function countBy<T>(items: readonly T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

/** Shallow copy of `obj` without the given keys (with an exact `Omit` type). */
export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const excluded = new Set<PropertyKey>(keys);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !excluded.has(k))) as Omit<T, K>;
}

/** Item with the largest value (the first one on ties) in O(n), without sorting the whole array. */
export function maxBy<T>(items: readonly T[], value: (item: T) => number): T | undefined {
  let best: T | undefined;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (const item of items) {
    const v = value(item);
    if (v > bestValue) {
      best = item;
      bestValue = v;
    }
  }
  return best;
}

/**
 * Record with one entry per key of a closed set (for example the stages). TypeScript cannot prove that
 * `Object.fromEntries` covers every key; the only cast lives here, next to the guarantee: the whole
 * key list is traversed.
 */
export function recordFromKeys<K extends string, V>(keys: readonly K[], value: (key: K) => V): Record<K, V> {
  return Object.fromEntries(keys.map((k) => [k, value(k)])) as Record<K, V>;
}
