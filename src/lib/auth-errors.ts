import { messages } from "@/i18n";

/** Error codes the app itself sends to /login?error=… from the Auth.js signIn callback. */
export const AUTH_ERROR = { emailNotVerified: "EmailNotVerified", backendUnavailable: "BackendUnavailable" } as const;

/**
 * Message for an Auth.js error code (pages.error = "/login"), so the person never sees Auth.js's
 * generic "Server error" page. Null when there is no error.
 */
export function authErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  const t = messages.auth.authJsError;
  switch (code) {
    case "Configuration":
    case "CredentialsSignin":
    case "AccessDenied":
    case "Verification":
    case AUTH_ERROR.emailNotVerified:
    case AUTH_ERROR.backendUnavailable:
      return t[code];
    case "OAuthAccountNotLinked":
    case "OAuthCallbackError":
    case "OAuthSignin":
      return t.OAuthFailed;
    default:
      return t.default;
  }
}
