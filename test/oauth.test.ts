import { describe, expect, it } from "vitest";
import { perfilDesdeOAuth, proveedoresHabilitados } from "@/lib/oauth";

describe("perfilDesdeOAuth", () => {
  it("Google: usa `sub` como id y respeta email_verified", () => {
    expect(perfilDesdeOAuth("google", { sub: "123", email: "Ana@Gmail.com", email_verified: true, name: "Ana", picture: "https://x/a.png" })).toEqual({
      proveedor: "GOOGLE",
      idExterno: "123",
      email: "ana@gmail.com",
      emailVerificado: true,
      nombre: "Ana",
      imagen: "https://x/a.png",
    });
    expect(perfilDesdeOAuth("google", { sub: "1", email: "a@b.co", email_verified: "true" })?.emailVerificado).toBe(false);
  });

  it("Google sin id o sin correo no sirve", () => {
    expect(perfilDesdeOAuth("google", { email: "a@b.co" })).toBeNull();
    expect(perfilDesdeOAuth("google", { sub: "1" })).toBeNull();
  });

  it("GitHub con correo oculto usa el noreply, que no se vincula por correo", () => {
    const p = perfilDesdeOAuth("github", { id: 42, login: "jhoan", name: null, email: null });
    expect(p).toMatchObject({ proveedor: "GITHUB", idExterno: "42", email: "42+jhoan@users.noreply.github.com", emailVerificado: false, nombre: "jhoan" });
  });

  it("proveedores desconocidos devuelven null", () => {
    expect(perfilDesdeOAuth("credentials", { id: 1 })).toBeNull();
  });
});

describe("proveedoresHabilitados", () => {
  it("solo los que tienen clave, Google primero", () => {
    expect(proveedoresHabilitados({ AUTH_GITHUB_ID: "x", AUTH_GOOGLE_ID: "y" })).toEqual(["google", "github"]);
    expect(proveedoresHabilitados({ AUTH_GITHUB_ID: "x" })).toEqual(["github"]);
    expect(proveedoresHabilitados({ AUTH_GOOGLE_ID: "" })).toEqual([]);
  });
});
