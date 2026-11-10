import { NextResponse } from "next/server";
import { serverEnv } from "@/config/env";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — public, exposes no data. Vercel's daily cron calls it (vercel.json): it wakes the
 * backend (Render's free plan sleeps after 15 idle minutes) and, through the backend's /health, runs one
 * query so Supabase does not pause the project. Also useful for uptime monitoring.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    // A sleeping Render instance can take ~50 s to answer.
    const res = await fetch(`${serverEnv.backendUrl}/health`, { cache: "no-store", signal: AbortSignal.timeout(60_000) });
    const backend = (await res.json().catch(() => null)) as unknown;
    return NextResponse.json({ ok: res.ok, backend, ms: Date.now() - startedAt }, { status: res.ok ? 200 : 503, headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("[health] the backend did not answer:", e);
    return NextResponse.json({ ok: false, backend: null, ms: Date.now() - startedAt }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}

/** Gives the cron call room for a cold start. */
export const maxDuration = 60;
