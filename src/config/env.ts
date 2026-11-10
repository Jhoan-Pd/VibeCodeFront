import "server-only";

/**
 * Server-side configuration. The backend URL and the shared JWT secret never reach the browser;
 * the browser only knows NEXT_PUBLIC_BACKEND_URL (see lib/rpc/browser.ts).
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const trimSlash = (url: string) => url.replace(/\/+$/, "");

export const serverEnv = {
  get backendUrl(): string {
    return trimSlash(process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000");
  },
  /** HS256 secret shared with the backend (BACKEND_JWT_SECRET there too). */
  get jwtSecret(): Uint8Array {
    return new TextEncoder().encode(required("BACKEND_JWT_SECRET"));
  },
};
