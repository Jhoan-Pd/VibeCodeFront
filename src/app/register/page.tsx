import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { messages } from "@/i18n";
import { enabledProviders } from "@/lib/oauth";

const t = messages.auth.register;

export const metadata: Metadata = { title: t.metaTitle };

export default function RegisterPage() {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm providers={enabledProviders(process.env)} />
        </CardContent>
      </Card>
    </div>
  );
}
