import type { CSSProperties } from "react";

/**
 * Staggered delay for entrance animations: item `i` enters `stepMs` after the previous one, capped at
 * six steps so a long list does not take long to appear. No "use client": usable from Server and Client
 * Components alike.
 */
export function staggerDelay(i: number, stepMs = 70): CSSProperties {
  return { ["--vd-delay" as string]: `${Math.min(i, 6) * stepMs}ms` } as CSSProperties;
}
