"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Alert, Spinner } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { emailProblem } from "@/lib/email";
import type { ProviderName } from "@/lib/oauth";
import { attempt } from "@/lib/rpc/errors";
import { rpc } from "@/lib/rpc/browser";

const t = messages.auth;

const PROVIDER_BUTTON: Record<ProviderName, { text: string; icon: React.ReactNode }> = {
  // Neutral mark (a "G" in the app's typeface), not Google's logo.
  google: { text: t.oauth.google, icon: <span aria-hidden className="flex size-4 items-center justify-center rounded-full border text-[10px] font-bold">G</span> },
  github: { text: t.oauth.github, icon: <Github /> },
};

/** Google/GitHub buttons (only the ones configured on the server) and the "or with your e-mail" divider. */
function OAuthButtons({ providers, callbackUrl }: { providers: ProviderName[]; callbackUrl: string }) {
  const [pending, setPending] = useState<ProviderName | null>(null);
  if (providers.length === 0) return null;
  return (
    <>
      <div className="space-y-2">
        {providers.map((p) => (
          <Button
            key={p}
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending !== null}
            onClick={() => {
              setPending(p);
              void signIn(p, { redirectTo: callbackUrl });
            }}
          >
            {pending === p ? <Spinner /> : PROVIDER_BUTTON[p].icon} {PROVIDER_BUTTON[p].text}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> {t.oauth.separator} <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}

function ErrorAlert({ error }: { error: string | null }) {
  if (!error) return null;
  // The key replays the shake animation when the same form fails again with another message.
  return (
    <Alert key={error} variant="error" className="vd-shake">
      {error}
    </Alert>
  );
}

export function LoginForm({ callbackUrl, providers }: { callbackUrl: string; providers: ProviderName[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (!res || res.error) {
        setError(res?.code === "backend_unavailable" ? t.authJsError.BackendUnavailable : t.login.wrongCredentials);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(t.login.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <OAuthButtons callbackUrl={callbackUrl} providers={providers} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ErrorAlert error={error} />
        <div className="space-y-2">
          <Label htmlFor="email">{t.fields.email}</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t.fields.password}</Label>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !email || !password}>
          {loading && <Spinner />} {t.login.submit}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {t.login.noAccount}{" "}
        <Link className="text-primary underline-offset-4 hover:underline" href="/register">
          {t.login.createOne}
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm({ providers }: { providers: ProviderName[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  // The e-mail problem shows when leaving the field, or right away when it has accents or "ñ".
  const problem = emailProblem(email);
  const showProblem = Boolean(problem) && (emailTouched || /[^\x00-\x7f]/.test(email));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (problem) {
      setEmailTouched(true);
      document.getElementById("email")?.focus();
      return;
    }
    setLoading(true);
    // Register is a public RPC: the browser calls the backend directly.
    const registered = await attempt(() => rpc.user.register({ name, email, password }));
    if (!registered.ok) {
      setError(registered.error || t.register.failed);
      setLoading(false);
      return;
    }
    try {
      // Signs in right away with the credentials just created.
      const login = await signIn("credentials", { email, password, redirect: false });
      if (!login || login.error) {
        // The account does exist: /login explains it instead of leaving the person without a word.
        router.push("/login?created=1");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      router.push("/login?created=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <OAuthButtons callbackUrl="/dashboard" providers={providers} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ErrorAlert error={error} />
        <div className="space-y-2">
          <Label htmlFor="name">{t.register.name}</Label>
          <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t.fields.email}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            aria-invalid={showProblem}
            aria-describedby={showProblem ? "email-problem" : undefined}
            className={showProblem ? "border-destructive focus-visible:ring-destructive" : undefined}
          />
          {showProblem && (
            <p id="email-problem" className="vd-pop text-xs text-destructive" role="status">
              {problem}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t.fields.password}</Label>
          <Input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground">{t.register.passwordHint}</p>
        </div>
        <Button type="submit" className="w-full" disabled={loading || !name || !email || password.length < 8}>
          {loading && <Spinner />} {t.register.submit}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {t.register.haveAccount}{" "}
        <Link className="text-primary underline-offset-4 hover:underline" href="/login">
          {t.register.signIn}
        </Link>
      </p>
    </div>
  );
}
