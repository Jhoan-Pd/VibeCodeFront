"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, Link2, Link2Off, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { rpc } from "@/lib/rpc/browser";
import { attempt } from "@/lib/rpc/errors";
import { publicUrl } from "@/lib/share";

const t = messages.analysis.actions;

/** Export (Markdown / PDF) and sharing with a public read-only link (EnableShareLink / DisableShareLink). */
export function AnalysisActions({ analysisId, initialToken }: { analysisId: string; initialToken: string | null }) {
  const [token, setToken] = useState(initialToken);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);
  const url = token && origin ? publicUrl(origin, token) : "";

  async function enable() {
    setLoading(true);
    setError(null);
    const r = await attempt(() => rpc.share.enableShareLink({ analysisId }));
    setLoading(false);
    if (r.ok) setToken(r.data.token);
    else setError(r.error || t.updateFailed);
    setCopied(false);
  }

  async function disable() {
    setLoading(true);
    setError(null);
    const r = await attempt(() => rpc.share.disableShareLink({ analysisId }));
    setLoading(false);
    if (r.ok) setToken(null);
    else setError(r.error || t.updateFailed);
    setCopied(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t.copyFailed);
    }
  }

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={`/analysis/${analysisId}/export`} download>
          <Download /> {t.markdown}
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={`/analysis/${analysisId}/print`}>
          <Printer /> {t.pdf}
        </Link>
      </Button>
      <Button variant={token ? "secondary" : "outline"} size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="share-panel">
        <Share2 /> {token ? t.shared : t.share}
      </Button>

      {open && (
        <Card id="share-panel" className="vd-drop absolute right-0 top-full z-30 mt-2 w-[min(92vw,380px)] space-y-3 p-4 shadow-lg">
          <div>
            <p className="text-sm font-medium">{t.panelTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.panelBody}</p>
          </div>
          {token ? (
            <>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={url}
                  aria-label={t.linkLabel}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs"
                />
                <Button size="sm" onClick={copy} aria-label={t.copyLink}>
                  {copied ? <Check className="vd-pulse" /> : <Copy />} {copied ? messages.common.copied : messages.common.copy}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={disable} disabled={loading} className="text-destructive hover:text-destructive">
                {loading ? <Spinner /> : <Link2Off />} {t.stopSharing}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={enable} disabled={loading}>
              {loading ? <Spinner /> : <Link2 />} {t.createLink}
            </Button>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </Card>
      )}
    </div>
  );
}
