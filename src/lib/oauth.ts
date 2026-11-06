/**
 * Inicio de sesión con proveedores externos (Google, GitHub): lógica pura, probada con Vitest.
 * Traduce el perfil que entrega cada proveedor a un formato común para que el servicio de usuarios
 * no conozca los nombres de campo de cada API (`sub` en Google, `id` en GitHub…).
 */

export type NombreProveedor = "google" | "github";
export type ProveedorBD = "GOOGLE" | "GITHUB";

export interface PerfilOAuth {
  proveedor: ProveedorBD;
  /** Id estable del usuario en el proveedor (no cambia aunque cambie su correo). */
  idExterno: string;
  email: string;
  /** Solo un correo verificado por el proveedor puede vincularse a una cuenta existente con ese correo. */
  emailVerificado: boolean;
  nombre: string | null;
  imagen: string | null;
}

type Perfil = Record<string, unknown>;
const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Orden en que se muestran los botones: Google primero (la opción más común). */
const ORDEN: { nombre: NombreProveedor; variable: string }[] = [
  { nombre: "google", variable: "AUTH_GOOGLE_ID" },
  { nombre: "github", variable: "AUTH_GITHUB_ID" },
];

/** Proveedores con credenciales configuradas en el entorno: sin clave no se muestra el botón. */
export function proveedoresHabilitados(env: Record<string, string | undefined>): NombreProveedor[] {
  return ORDEN.filter((p) => Boolean(env[p.variable])).map((p) => p.nombre);
}

/** Perfil común a partir del perfil crudo del proveedor; null si el proveedor no es OAuth conocido o falta el id. */
export function perfilDesdeOAuth(proveedor: string, perfil: Perfil): PerfilOAuth | null {
  if (proveedor === "google") {
    const idExterno = texto(perfil.sub);
    const email = texto(perfil.email)?.toLowerCase();
    if (!idExterno || !email) return null;
    return {
      proveedor: "GOOGLE",
      idExterno,
      email,
      emailVerificado: perfil.email_verified === true,
      nombre: texto(perfil.name),
      imagen: texto(perfil.picture),
    };
  }
  if (proveedor === "github") {
    if (perfil.id == null) return null;
    const idExterno = String(perfil.id);
    const correo = texto(perfil.email)?.toLowerCase() ?? null;
    // Algunos usuarios ocultan su correo: se usa el «noreply» de GitHub, que es único pero no vinculable.
    const email = correo ?? `${idExterno}+${texto(perfil.login) ?? "usuario"}@users.noreply.github.com`;
    return {
      proveedor: "GITHUB",
      idExterno,
      email,
      // Auth.js pide a GitHub el correo principal, que GitHub exige verificado.
      emailVerificado: correo !== null,
      nombre: texto(perfil.name) ?? texto(perfil.login),
      imagen: texto(perfil.avatar_url),
    };
  }
  return null;
}
