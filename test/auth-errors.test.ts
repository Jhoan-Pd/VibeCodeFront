import { describe, expect, it } from "vitest";
import { AUTH_ERROR, authErrorMessage } from "@/lib/auth-errors";

describe("authErrorMessage", () => {
  it("shows nothing without a code", () => {
    expect(authErrorMessage(undefined)).toBeNull();
    expect(authErrorMessage("")).toBeNull();
  });

  it("explains the configuration error and how to fix it", () => {
    expect(authErrorMessage("Configuration")).toContain("AUTH_SECRET");
    expect(authErrorMessage("Configuration")).toContain("BACKEND_JWT_SECRET");
  });

  it("translates known errors and gives a generic message for the rest", () => {
    expect(authErrorMessage("CredentialsSignin")).toBe("Correo o contraseña incorrectos.");
    expect(authErrorMessage("OAuthSignin")).toContain("Google o GitHub");
    expect(authErrorMessage(AUTH_ERROR.emailNotVerified)).toContain("verifica el correo");
    expect(authErrorMessage(AUTH_ERROR.backendUnavailable)).toContain("no responde");
    expect(authErrorMessage("<script>")).toBe("No se pudo iniciar sesión. Inténtalo de nuevo.");
  });
});
