import Link from "next/link";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n";

const t = messages.shell.notFound;

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="vd-title text-3xl sm:text-4xl">{t.title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t.body}</p>
      <Button asChild>
        <Link href="/dashboard">{t.action}</Link>
      </Button>
    </div>
  );
}
