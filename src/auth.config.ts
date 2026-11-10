import type { NextAuthConfig } from "next-auth";

/**
 * Auth.js configuration that runs on the Edge runtime (the middleware uses it): no providers that
 * call the backend live here; those are in auth.ts (Node runtime).
 */
export const authConfig = {
  // Auth.js errors also go to /login (with ?error=…), where they are explained in Spanish.
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [],
} satisfies NextAuthConfig;
