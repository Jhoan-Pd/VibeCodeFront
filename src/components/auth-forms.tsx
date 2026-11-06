"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pedirJson } from "@/lib/client/api";
import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Alert, Spinner } from "@/components/ui/misc";
import { problemaCorreo } from "@/lib/correo";
import { MENSAJE_BD_NO_DISPONIBLE } from "@/lib/errores-bd";
import type { NombreProveedor } from "@/lib/oauth";

const ETIQUETA: Record<NombreProveedor, { texto: string; icono: React.ReactNode }> = {
  // Marca neutra (una «G» con la tipografía de la app), no el logotipo de Google.
  google: { texto: "Continuar con Google", icono: <span aria-hidden className="flex size-4 items-center justify-center rounded-full border text-[10px] font-bold">G</span> },
  github: { texto: "Continuar con GitHub", icono: <Github /> },
};

/** Botones de Google/GitHub (solo los configurados en el servidor) y el separador «o con tu correo». */
function BotonesOAuth({ proveedores, callbackUrl }: { proveedores: NombreProveedor[]; callbackUrl: string }) {
  const [yendo, setYendo] = useState<NombreProveedor | null>(null);
  if (proveedores.length === 0) return null;
  return (
    <>
      <div className="space-y-2">
        {proveedores.map((p) => (
          <Button
            key={p}
            type="button"
            variant="outline"
            className="w-full"
            disabled={yendo !== null}
            onClick={() => {
              setYendo(p);
              void signIn(p, { redirectTo: callbackUrl });
            }}
          >
            {yendo === p ? <Spinner /> : ETIQUETA[p].icono} {ETIQUETA[p].texto}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> o con tu correo <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}

export function LoginForm({ callbackUrl, proveedores }: { callbackUrl: string; proveedores: NombreProveedor[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (!res || res.error) {
        setError(res?.code === "bd_no_disponible" ? MENSAJE_BD_NO_DISPONIBLE : "Correo o contraseña incorrectos.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="space-y-4">
      <BotonesOAuth callbackUrl={callbackUrl} proveedores={proveedores} />
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {error && (
          <Alert key={error} variant="error" className="vd-shake">
            {error}
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={cargando || !email || !password}>
          {cargando && <Spinner />} Entrar
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link className="text-primary underline-offset-4 hover:underline" href={`/register`}>
          Crea una
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm({ proveedores }: { proveedores: NombreProveedor[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [emailTocado, setEmailTocado] = useState(false);
  // El problema del correo se avisa al salir del campo, o de inmediato si tiene tildes o «ñ».
  const problema = problemaCorreo(email);
  const mostrarProblema = Boolean(problema) && (emailTocado || /[^\x00-\x7f]/.test(email));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (problema) {
      setEmailTocado(true);
      document.getElementById("email")?.focus();
      return;
    }
    setCargando(true);
    const registro = await pedirJson("/api/register", { cuerpo: { nombre, email, password }, errorPorDefecto: "No se pudo crear la cuenta." });
    if (!registro.ok) {
      setError(registro.error);
      setCargando(false);
      return;
    }
    try {
      // Inicia sesión automáticamente con las credenciales recién creadas.
      const login = await signIn("credentials", { email, password, redirect: false });
      if (!login || login.error) {
        // La cuenta sí se creó: se avisa en /login en vez de dejar a la persona sin explicación.
        router.push("/login?creada=1");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      // La cuenta ya existe aunque el inicio de sesión automático falle: se manda a /login con el aviso.
      router.push("/login?creada=1");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="space-y-4">
      <BotonesOAuth callbackUrl="/dashboard" proveedores={proveedores} />
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {error && (
          <Alert key={error} variant="error" className="vd-shake">
            {error}
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" autoComplete="name" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTocado(true)}
            aria-invalid={mostrarProblema}
            aria-describedby={mostrarProblema ? "email-problema" : undefined}
            className={mostrarProblema ? "border-destructive focus-visible:ring-destructive" : undefined}
          />
          {mostrarProblema && (
            <p id="email-problema" className="vd-pop text-xs text-destructive" role="status">
              {problema}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
        </div>
        <Button type="submit" className="w-full" disabled={cargando || !nombre || !email || password.length < 8}>
          {cargando && <Spinner />} Crear cuenta
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link className="text-primary underline-offset-4 hover:underline" href="/login">
          Entra
        </Link>
      </p>
    </div>
  );
}
