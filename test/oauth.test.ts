import { describe, expect, it } from "vitest";
import { enabledProviders, profileFromOAuth } from "@/lib/oauth";

describe("profileFromOAuth", () => {
  it("Google: uses `sub` as the id and honours email_verified", () => {
    expect(profileFromOAuth("google", { sub: "123", email: "Ana@Gmail.com", email_verified: true, name: "Ana", picture: "https://x/a.png" })).toEqual({
      provider: "google",
      providerAccountId: "123",
      email: "ana@gmail.com",
      emailVerified: true,
      name: "Ana",
      imageUrl: "https://x/a.png",
    });
    expect(profileFromOAuth("google", { sub: "1", email: "a@b.co", email_verified: "true" })?.emailVerified).toBe(false);
  });

  it("Google without an id or an e-mail is useless", () => {
    expect(profileFromOAuth("google", { email: "a@b.co" })).toBeNull();
    expect(profileFromOAuth("google", { sub: "1" })).toBeNull();
  });

  it("GitHub with a hidden e-mail uses the noreply address, which is never linked by e-mail", () => {
    const p = profileFromOAuth("github", { id: 42, login: "jhoan", name: null, email: null });
    expect(p).toMatchObject({ provider: "github", providerAccountId: "42", email: "42+jhoan@users.noreply.github.com", emailVerified: false, name: "jhoan" });
  });

  it("unknown providers return null", () => {
    expect(profileFromOAuth("credentials", { id: 1 })).toBeNull();
  });
});

describe("enabledProviders", () => {
  it("only the ones with a key, Google first", () => {
    expect(enabledProviders({ AUTH_GITHUB_ID: "x", AUTH_GOOGLE_ID: "y" })).toEqual(["google", "github"]);
    expect(enabledProviders({ AUTH_GITHUB_ID: "x" })).toEqual(["github"]);
    expect(enabledProviders({ AUTH_GOOGLE_ID: "" })).toEqual([]);
  });
});
