import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { signUserToken } from "@/lib/rpc/tokens";

/**
 * Hands the browser a 5-minute token to call the backend as the signed-in user. Same-origin only
 * (the session cookie is SameSite=Lax) and never cached. Without a session it answers 401 and the
 * browser calls the backend anonymously (public RPCs still work).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers: { "cache-control": "no-store" } });
  const issued = await signUserToken(session.user.id);
  return NextResponse.json(issued, { headers: { "cache-control": "no-store, private" } });
}
