"use client";

import Link from "next/link";
import { LogOut, ScanSearch } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n";
import { clearBackendToken } from "@/lib/rpc/browser";

const t = messages.shell.nav;

/**
 * Client island: it reads the session in the browser, so the pages around it can be static.
 * While the session loads the actions keep their space (no layout shift).
 */
export function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur print:hidden">
      <div className="container flex h-14 items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ScanSearch className="size-4" />
          </span>
          {messages.common.appName}
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label={t.label} aria-busy={status === "loading"}>
          {status === "loading" ? (
            <span className="h-8 w-40" aria-hidden />
          ) : user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">{t.history}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/progress">{t.progress}</Link>
              </Button>
              <Button asChild size="sm" variant="contrast">
                <Link href="/analyze">{t.newAnalysis}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link href="/profile">{user.name ?? t.profile}</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t.signOut}
                onClick={() => {
                  clearBackendToken();
                  void signOut({ redirectTo: "/" });
                }}
              >
                <LogOut />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t.signIn}</Link>
              </Button>
              <Button asChild size="sm" variant="contrast">
                <Link href="/register">{t.signUp}</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
