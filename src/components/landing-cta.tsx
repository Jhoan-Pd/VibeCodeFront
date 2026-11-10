"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { publicConfig } from "@/config/public";
import { messages } from "@/i18n";

const t = messages.landing.cta;

/**
 * The landing's main call to action: the only part of the page that depends on the session, so it is a
 * small client island and the rest of the page is generated statically (SSG). Before the session is known
 * it renders the signed-out version, which is also what search engines see.
 */
export function LandingCta({ withSecondary = false }: { withSecondary?: boolean }) {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href={signedIn ? "/analyze" : "/register"}>
            {signedIn ? t.signedIn : t.signedOut} <ArrowRight />
          </Link>
        </Button>
        {withSecondary && (
          <Button asChild size="lg" variant="outline">
            <a href="#demo">{messages.landing.seeExample}</a>
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{signedIn ? t.noteSignedIn : t.noteSignedOut(publicConfig.dailyAnalyses)}</p>
    </div>
  );
}
