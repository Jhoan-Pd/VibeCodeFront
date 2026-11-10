/** Public read-only URL of a shared analysis. */
export function publicUrl(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, "")}/c/${encodeURIComponent(token)}`;
}

const TOKEN_FORMAT = /^[A-Za-z0-9_-]{32}$/;

/** Same format the backend issues (192 random bits, base64url): junk URLs never reach the backend. */
export function isValidShareToken(token: unknown): token is string {
  return typeof token === "string" && TOKEN_FORMAT.test(token);
}
