import { describe, expect, it, vi } from "vitest";
import { TokenCache } from "@/lib/rpc/token-cache";

describe("TokenCache", () => {
  it("reuses a valid token and renews it shortly before it expires", async () => {
    let now = 0;
    const fetchToken = vi.fn(async () => ({ token: `t${fetchToken.mock.calls.length}`, expiresAt: now + 300_000 }));
    const cache = new TokenCache(fetchToken, 30_000, () => now);

    expect(await cache.get()).toBe("t1");
    now = 200_000;
    expect(await cache.get()).toBe("t1");
    now = 280_000; // inside the 30 s margin
    expect(await cache.get()).toBe("t2");
    expect(fetchToken).toHaveBeenCalledTimes(2);
  });

  it("concurrent callers share a single request", async () => {
    const fetchToken = vi.fn(async () => ({ token: "t", expiresAt: Date.now() + 300_000 }));
    const cache = new TokenCache(fetchToken);
    await Promise.all([cache.get(), cache.get(), cache.get()]);
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it("without a session (or on failure) returns null and tries again next time", async () => {
    const fetchToken = vi.fn().mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ token: "t", expiresAt: Date.now() + 300_000 });
    const cache = new TokenCache(fetchToken);
    expect(await cache.get()).toBeNull();
    expect(await cache.get()).toBeNull();
    expect(await cache.get()).toBe("t");
  });

  it("clear() forgets the token (sign-out)", async () => {
    const fetchToken = vi.fn(async () => ({ token: "t", expiresAt: Date.now() + 300_000 }));
    const cache = new TokenCache(fetchToken);
    await cache.get();
    cache.clear();
    await cache.get();
    expect(fetchToken).toHaveBeenCalledTimes(2);
  });
});
