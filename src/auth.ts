import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { esBaseNoDisponible } from "./lib/errores-bd";
import { perfilDesdeOAuth, proveedoresHabilitados } from "./lib/oauth";
import { LoginSchema } from "./schemas/auth";
import { CorreoNoVerificadoError, verificarCredenciales, vincularUsuarioOAuth } from "./services/usuarios";

/** Login con correo cuando la BD no responde: el formulario lo distingue de «contraseña incorrecta». */
class BaseNoDisponible extends CredentialsSignin {
  code = "bd_no_disponible";
}

/**
 * Proveedores OAuth activos según el entorno. Leen AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET y
 * AUTH_GITHUB_ID/AUTH_GITHUB_SECRET; sin clave, el proveedor no se registra ni se muestra.
 */
const OAUTH: Record<ReturnType<typeof proveedoresHabilitados>[number], Provider> = { google: Google, github: GitHub };

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
 * Auth.js v5 con sesión JWT (necesario para el proveedor de credenciales) y SIN adaptador:
 * los usuarios viven en nuestra tabla `usuarios` y sus vínculos con Google o GitHub en
 * `cuentas_oauth`. El vínculo se resuelve en el callback jwt; el id interno de la BD viaja
 * en el token como `uid`.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...proveedoresHabilitados(process.env).map((nombre) => OAUTH[nombre]),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = LoginSchema.safeParse(raw);
        if (!parsed.success) return null;
        let usuario;
        try {
          usuario = await verificarCredenciales(parsed.data.email, parsed.data.password);
        } catch (e) {
          if (esBaseNoDisponible(e)) throw new BaseNoDisponible();
          throw e;
        }
        if (!usuario) return null;
        return { id: usuario.id, name: usuario.nombre, email: usuario.email, image: usuario.imagen };
      },
    }),
  ],
  callbacks: {
    /**
     * Con Google o GitHub, aquí se encuentra o crea el usuario en NUESTRA BD y se reemplaza `user.id`
     * (que trae el id del proveedor) por el id interno; el callback jwt lo guarda en el token.
     * Devolver false lleva a /login?error=AccessDenied; una ruta, a esa página.
     */
    async signIn({ user, account, profile }) {
      if (account?.type !== "oauth" && account?.type !== "oidc") return true;
      const perfil = profile ? perfilDesdeOAuth(account.provider, profile) : null;
      if (!perfil) return false;
      try {
        user.id = (await vincularUsuarioOAuth(perfil)).id;
        return true;
      } catch (e) {
        if (e instanceof CorreoNoVerificadoError) return "/login?error=CorreoNoVerificado";
        if (esBaseNoDisponible(e)) return "/login?error=BaseNoDisponible";
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
