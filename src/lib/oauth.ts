/**
 * Sign-in with external providers (Google, GitHub): pure logic, unit tested.
 * Translates each provider's profile into one shape so the backend never learns each API's field names
 * (`sub` on Google, `id` on GitHub…).
 */

export type ProviderName = "google" | "github";

export interface OAuthProfile {
  provider: ProviderName;
  /** Stable id of the user at the provider (does not change when the e-mail does). */
  providerAccountId: string;
  email: string;
  /** Only an e-mail verified by the provider may be linked to an existing account with that e-mail. */
  emailVerified: boolean;
  name: string | null;
  imageUrl: string | null;
}

type RawProfile = Record<string, unknown>;
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Order of the buttons: Google first (the most common option). */
const PROVIDERS: { name: ProviderName; envVar: string }[] = [
  { name: "google", envVar: "AUTH_GOOGLE_ID" },
  { name: "github", envVar: "AUTH_GITHUB_ID" },
];

/** Providers with credentials in the environment: without a key the button is not shown. */
export function enabledProviders(env: Record<string, string | undefined>): ProviderName[] {
  return PROVIDERS.filter((p) => Boolean(env[p.envVar])).map((p) => p.name);
}

/** Common profile from the provider's raw profile; null for unknown providers or a missing id. */
export function profileFromOAuth(provider: string, raw: RawProfile): OAuthProfile | null {
  if (provider === "google") {
    const providerAccountId = text(raw.sub);
    const email = text(raw.email)?.toLowerCase();
    if (!providerAccountId || !email) return null;
    return {
      provider: "google",
      providerAccountId,
      email,
      emailVerified: raw.email_verified === true,
      name: text(raw.name),
      imageUrl: text(raw.picture),
    };
  }
  if (provider === "github") {
    if (raw.id == null) return null;
    const providerAccountId = String(raw.id);
    const publicEmail = text(raw.email)?.toLowerCase() ?? null;
    // Some people hide their e-mail: GitHub's "noreply" address is unique but cannot be linked.
    const email = publicEmail ?? `${providerAccountId}+${text(raw.login) ?? "user"}@users.noreply.github.com`;
    return {
      provider: "github",
      providerAccountId,
      email,
      // Auth.js asks GitHub for the primary e-mail, which GitHub requires to be verified.
      emailVerified: publicEmail !== null,
      name: text(raw.name) ?? text(raw.login),
      imageUrl: text(raw.avatar_url),
    };
  }
  return null;
}
