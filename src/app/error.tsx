"use client";

import { Button } from "@/components/ui/button";
import { messages } from "@/i18n";

const t = messages.shell.error;

/** Global error boundary: a friendly message and a retry, never internal details. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="vd-title text-3xl sm:text-4xl">{t.title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t.body}</p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          {t.reference}: {error.digest}
        </p>
      )}
      <Button onClick={reset}>{messages.common.retry}</Button>
    </div>
  );
}
