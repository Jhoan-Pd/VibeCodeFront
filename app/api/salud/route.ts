import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { esBaseNoDisponible } from "@/lib/errores-bd";

export const dynamic = "force-dynamic";

/**
 * GET /api/salud — comprueba que la base de datos responde (ruta pública, no expone datos).
 * La llama el cron diario de vercel.json: Supabase pausa los proyectos gratuitos que pasan días
 * sin consultas, y esta consulta mínima lo mantiene activo. También sirve para monitoreo.
 */
export async function GET() {
  const inicio = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, bd: "ok", ms: Date.now() - inicio }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("[salud] la base de datos no respondió:", e);
    return NextResponse.json(
      { ok: false, bd: esBaseNoDisponible(e) ? "no_disponible" : "error" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
