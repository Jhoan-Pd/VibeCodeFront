/**
 * In-memory cache of a short-lived token (pure, unit tested). Concurrent callers share one in-flight
 * request, and the token is renewed `refreshMarginMs` before it expires so a call never leaves with a
 * token that dies on the way.
 */
export interface Token {
  token: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

export class TokenCache {
  private current: Token | null = null;
  private pending: Promise<Token | null> | null = null;

  constructor(
    private readonly fetchToken: () => Promise<Token | null>,
    private readonly refreshMarginMs = 30_000,
    private readonly now: () => number = Date.now,
  ) {}

  async get(): Promise<string | null> {
    if (this.current && this.current.expiresAt - this.refreshMarginMs > this.now()) return this.current.token;
    this.pending ??= this.fetchToken()
      .catch(() => null)
      .finally(() => {
        this.pending = null;
      });
    this.current = await this.pending;
    return this.current?.token ?? null;
  }

  clear(): void {
    this.current = null;
  }
}
