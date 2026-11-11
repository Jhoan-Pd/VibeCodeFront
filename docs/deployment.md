# Guía de despliegue del frontend (Vercel)

El frontend ya no habla con la base de datos ni con la IA: eso vive en el backend ([vibedecoder-backend](https://github.com/Jhoan-Pd/vibedecoder-backend), en Render). Despliega primero el backend y ten a mano su URL y su `BACKEND_JWT_SECRET`.

Orden: 1) backend en Render, 2) proyecto nuevo en Vercel, 3) OAuth, 4) probar, 5) keep-alive.

> Mientras el despliegue anterior siga en uso (por ejemplo, durante una presentación), crea un **proyecto nuevo** en Vercel para este repositorio. No reutilices el proyecto actual. Cambia el dominio solo cuando el nuevo esté probado.

## 1. Backend

Sigue el README del backend: Blueprint de Render, `DATABASE_URL`/`DIRECT_URL` de Supabase, `GEMINI_API_KEY` y `BACKEND_JWT_SECRET`. Anota:

- la URL pública, por ejemplo `https://vibedecoder-backend.onrender.com`;
- el valor de `BACKEND_JWT_SECRET` (mínimo 32 caracteres; `openssl rand -base64 48`).

## 2. Vercel

1. **Add New → Project** e importa este repositorio. Framework: Next.js (se detecta solo).
2. Variables de entorno (Production y Preview):

| Variable | Valor |
|---|---|
| `BACKEND_URL` | URL del backend (la usa el servidor de Next) |
| `NEXT_PUBLIC_BACKEND_URL` | La misma URL (la usa el navegador; se incrusta al compilar) |
| `BACKEND_JWT_SECRET` | **El mismo valor** que en Render |
| `AUTH_SECRET` | `npx auth secret` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Opcional (paso 3) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | Opcional (paso 3) |
| `NEXT_PUBLIC_MAX_CODE_CHARS`, `NEXT_PUBLIC_DAILY_ANALYSIS_LIMIT` | Opcional: los mismos límites que el backend, para mostrarlos en la interfaz |

3. Despliega y copia la URL (por ejemplo `https://vibedecoder.vercel.app`).
4. En Render, agrega esa URL a `ALLOWED_ORIGINS` del backend (separa varias con comas, sin `/` final). Sin esto el navegador no puede llamar a la API (CORS).

## 3. Google y GitHub (opcional)

- **Google** (console.cloud.google.com → Credenciales → ID de cliente de OAuth, «Aplicación web»). URI de redirección: `https://TU-APP.vercel.app/api/auth/callback/google`. Para desarrollo, `http://localhost:3000/api/auth/callback/google`.
- **GitHub** (Settings → Developer settings → OAuth Apps). Callback: `https://TU-APP.vercel.app/api/auth/callback/github`.

Sin las claves, el botón correspondiente no aparece.

## 4. Probar

- `https://TU-APP.vercel.app/api/health` debe responder `{"ok":true,"backend":{"status":"ok","database":"ok",…}}`.
- La primera petición después de un rato sin uso tarda unos 50 s: el plan gratis de Render duerme el servicio.
- Crea una cuenta, analiza un código y comparte el enlace.

Errores comunes:

| Síntoma | Causa |
|---|---|
| «No autorizado. Inicia sesión.» en todas las acciones | `BACKEND_JWT_SECRET` distinto en Vercel y Render |
| El navegador muestra «No hay conexión con el servidor» | Falta la URL del frontend en `ALLOWED_ORIGINS`, o `NEXT_PUBLIC_BACKEND_URL` es incorrecta (vuelve a desplegar después de cambiarla: se incrusta al compilar) |
| `/login?error=Configuration` | Falta `AUTH_SECRET`, `BACKEND_URL` o `BACKEND_JWT_SECRET` |

## 5. Mantener los servicios activos

- `vercel.json` programa un cron diario a `/api/health`.
- En GitHub (Settings → Secrets and variables → Actions → Variables), crea `FRONTEND_URL` con la URL de Vercel para el workflow `keep-alive.yml`.
- GitHub desactiva los workflows programados tras 60 días sin commits. Si pasa, reactívalo en la pestaña **Actions**.
