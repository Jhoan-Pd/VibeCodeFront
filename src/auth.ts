import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { Code, ConnectError } from "@connectrpc/connect";
import { z } from "zod";
import { IdentityProvider, UserService } from "@/gen/vibedecoder/v1/user_pb";
import { authConfig } from "./auth.config";
import { AUTH_ERROR } from "./lib/auth-errors";
import { enabledProviders, profileFromOAuth, type ProviderName } from "./lib/oauth";
import { serviceClient } from "./lib/rpc/server";

/** Password sign-in while the backend is down: the form tells it apart from "wrong password". */
class BackendUnavailable extends CredentialsSignin {
  code = "backend_unavailable";
}

const CredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});

/**
 * OAuth providers enabled by the environment. They read AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET and
 * AUTH_GITHUB_ID/AUTH_GITHUB_SECRET; without a key the provider is neither registered nor shown.
 */
const OAUTH: Record<ProviderName, Provider> = { google: Google, github: GitHub };
const IDENTITY: Record<ProviderName, IdentityProvider> = { google: IdentityProvider.GOOGLE, github: IdentityProvider.GITHUB };

/** The backend could not answer (asleep, down, database paused): not the person's fault. */
const backendDown = (e: unknown) => {
  const code = ConnectError.from(e).code;
  return code === Code.Unavailable || code === Code.Unknown || code === Code.DeadlineExceeded || code === Code.Internal;
};

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
  }
}

/**
 * Auth.js v5 with JWT sessions and NO database adapter: users live in the backend. Passwords are
 * checked by the backend's VerifyCredentials and Google/GitHub accounts are linked by LinkOAuthAccount,
 * both with a service token, so the browser can never call them. The backend user id travels in the
 * session token as `uid`.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...enabledProviders(process.env).map((name) => OAUTH[name]),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        try {
          const { user } = await serviceClient(UserService).verifyCredentials(parsed.data);
          return user ? { id: user.id, name: user.name ?? null, email: user.email, image: user.imageUrl ?? null } : null;
        } catch (e) {
          if (backendDown(e)) throw new BackendUnavailable();
          throw e;
        }
      },
    }),
  ],
  callbacks: {
    /**
     * With Google or GitHub, the backend finds or creates OUR user and `user.id` (the provider's id) is
     * replaced by the internal id; the jwt callback stores it. Returning a path sends the person there.
     */
    async signIn({ user, account, profile }) {
      if (account?.type !== "oauth" && account?.type !== "oidc") return true;
      const oauth = profile ? profileFromOAuth(account.provider, profile) : null;
      if (!oauth) return false;
      try {
        const { userId } = await serviceClient(UserService).linkOAuthAccount({
          provider: IDENTITY[oauth.provider],
          externalId: oauth.providerAccountId,
          email: oauth.email,
          emailVerified: oauth.emailVerified,
          name: oauth.name ?? undefined,
          imageUrl: oauth.imageUrl ?? undefined,
        });
        user.id = userId;
        return true;
      } catch (e) {
        if (ConnectError.from(e).code === Code.FailedPrecondition) return `/login?error=${AUTH_ERROR.emailNotVerified}`;
        if (backendDown(e)) return `/login?error=${AUTH_ERROR.backendUnavailable}`;
        throw e;
      }
    },
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid;
      return session;
    },
  },
});
