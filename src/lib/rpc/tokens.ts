import "server-only";
import { SignJWT } from "jose";
import { serverEnv } from "@/config/env";

/**
 * Short-lived tokens the frontend server issues for the backend. The Auth.js session cookie never
 * leaves this app: the backend only trusts these signed claims (see backend/src/rpc/auth.ts).
 */
export const TOKEN_ISSUER = "vibedecoder-frontend";
export const TOKEN_AUDIENCE = "vibedecoder-backend";
export const TOKEN_TTL_SECONDS = 5 * 60;

export interface IssuedToken {
  token: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

async function sign(scope: "user" | "service", subject: string): Promise<IssuedToken> {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ scope })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setSubject(subject)
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL_SECONDS)
    .sign(serverEnv.jwtSecret);
  return { token, expiresAt: (now + TOKEN_TTL_SECONDS) * 1000 };
}

/** Acts as the signed-in user (server-rendered pages and the browser). */
export const signUserToken = (userId: string) => sign("user", userId);

/** Acts as the frontend itself: sign-in with a password, linking OAuth accounts. */
export const signServiceToken = () => sign("service", TOKEN_ISSUER);
