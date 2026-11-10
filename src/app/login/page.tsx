import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { authErrorMessage } from "@/lib/auth-errors";
import { enabledProviders } from "@/lib/oauth";
import { safeInternalPath } from "@/lib/safe-redirect";

const t = messages.auth.login;

export const metadata: Metadata = { title: t.metaTitle };

/** Dynamic (SSR): it reads the query string and the providers enabled by the server's environment. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string; created?: string }> }) {
  const { callbackUrl, error, created } = await searchParams;
  const errorMessage = authErrorMessage(error);
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {created === "1" && !errorMessage && (
            <Alert variant="success" title={t.accountCreatedTitle}>
              {t.accountCreatedBody}
            </Alert>
          )}
          {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
          <LoginForm callbackUrl={safeInternalPath(callbackUrl)} providers={enabledProviders(process.env)} />
        </CardContent>
      </Card>
    </div>
  );
}
