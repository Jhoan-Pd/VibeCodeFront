/**
 * Configuration the browser may know. NEXT_PUBLIC_* variables are inlined at build time, so these
 * values are constants in the static pages too. The backend enforces the real limits; these are for UX.
 */
function integer(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const publicConfig = {
  backendUrl: (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, ""),
  /** Maximum code size in characters (same default as the backend's MAX_CODE_CHARS). */
  maxCodeChars: integer(process.env.NEXT_PUBLIC_MAX_CODE_CHARS, 20_000),
  /** New analyses per day, shown on the landing page (the backend's DAILY_ANALYSIS_LIMIT). */
  dailyAnalyses: integer(process.env.NEXT_PUBLIC_DAILY_ANALYSIS_LIMIT, 10),
} as const;
