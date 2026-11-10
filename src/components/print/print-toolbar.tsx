"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n";

/**
 * Toolbar of the print view (not printed). While mounted it forces light mode so Mermaid draws the
 * diagrams on white; on unmount it restores the person's theme. "Save as PDF" is the browser's print
 * dialog: no heavy PDF dependency on the server.
 */
export function PrintToolbar({ backTo }: { backTo: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.remove("dark");
    // Waits for Mermaid to finish drawing in light mode before enabling the button.
    const t = setTimeout(() => setReady(true), 800);
    return () => {
      clearTimeout(t);
      if (wasDark) html.classList.add("dark");
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 print:hidden">
      <Button asChild variant="ghost" size="sm">
        <Link href={backTo}>
          <ArrowLeft /> {messages.common.back}
        </Link>
      </Button>
      <p className="text-sm text-muted-foreground">{messages.print.hint}</p>
      <Button size="sm" onClick={() => window.print()} disabled={!ready}>
        <Printer /> {messages.print.action}
      </Button>
    </div>
  );
}
