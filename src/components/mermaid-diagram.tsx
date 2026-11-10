"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Skeleton, Spinner } from "@/components/ui/misc";
import { useIsDark } from "@/hooks/use-is-dark";
import { messages } from "@/i18n";
import { rpc } from "@/lib/rpc/browser";
import { attempt } from "@/lib/rpc/errors";
import { toProtoDiagramKind } from "@/lib/rpc/mappers";
import type { DiagramKind } from "@/types/analysis-view";

const t = messages.viewer.diagrams;

type RenderState = "loading" | "ok" | "error";

const FONT = '"Inter Variable", ui-sans-serif, system-ui, sans-serif';
const LIGHT_THEME = {
  fontFamily: FONT,
  background: "#ffffff",
  primaryColor: "#e8edf8",
  primaryBorderColor: "#275fce",
  primaryTextColor: "#16181d",
  secondaryColor: "#f2f3f3",
  tertiaryColor: "#fcfcfc",
  lineColor: "#51585d",
  textColor: "#16181d",
  noteBkgColor: "#fdf6e3",
  noteTextColor: "#16181d",
};
const DARK_THEME = {
  fontFamily: FONT,
  darkMode: true,
  background: "#1d2026",
  primaryColor: "#1f2b45",
  primaryBorderColor: "#6c8de0",
  primaryTextColor: "#f6f8f8",
  secondaryColor: "#23272c",
  tertiaryColor: "#16181d",
  lineColor: "#a8aeb3",
  textColor: "#f6f8f8",
  noteBkgColor: "#2b2a22",
  noteTextColor: "#f6f8f8",
};

/**
 * Renders Mermaid in the browser. Robustness flow:
 *  1) mermaid.parse() validates the syntax BEFORE drawing,
 *  2) when it fails, a friendly message is shown (never Mermaid's error "bomb"),
 *  3) on the owner's analysis, the LLM can be asked to fix it (RepairDiagram).
 * Security: securityLevel "strict" => Mermaid sanitises the SVG (DOMPurify) and disables click/HTML.
 */
export function MermaidDiagram({ source: initialSource, analysisId, kind = "FLOW" }: { source: string; analysisId?: string; kind?: DiagramKind }) {
  const router = useRouter();
  const dark = useIsDark();
  const baseId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [source, setSource] = useState(initialSource);
  const [svg, setSvg] = useState("");
  const [state, setState] = useState<RenderState>("loading");
  const [parserError, setParserError] = useState("");
  const [repairing, setRepairing] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // When the server sends a different diagram (after router.refresh), follow it.
  useEffect(() => setSource(initialSource), [initialSource]);

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          // "base" theme with the app palette (globals.css tokens) so the diagram fits in.
          theme: "base",
          themeVariables: dark ? DARK_THEME : LIGHT_THEME,
          suppressErrorRendering: true,
          flowchart: { htmlLabels: false, curve: "basis" },
          sequence: { useMaxWidth: true },
          class: { htmlLabels: false },
        });
        await mermaid.parse(source); // throws on invalid syntax
        const { svg } = await mermaid.render(`mmd-${baseId}-${Date.now()}`, source);
        if (cancelled) return;
        setSvg(svg);
        setState("ok");
      } catch (e) {
        if (cancelled) return;
        setParserError(e instanceof Error ? e.message : String(e));
        setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, dark, baseId]);

  async function repairWithAi() {
    if (!analysisId) return;
    setRepairing(true);
    setRepairError(null);
    const r = await attempt(() => rpc.analysis.repairDiagram({ analysisId, kind: toProtoDiagramKind(kind), parserError: parserError.slice(0, 1500) }));
    setRepairing(false);
    if (!r.ok || !r.data.diagram) {
      setRepairError((!r.ok && r.error) || t.repairFailed);
      return;
    }
    setSource(r.data.diagram.mermaid);
    router.refresh();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="space-y-3">
      {state === "loading" && (
        <div className="space-y-3 p-6" aria-busy="true" aria-label={t.drawing}>
          <Skeleton className="mx-auto h-10 w-48" />
          <Skeleton className="mx-auto h-10 w-64" />
          <Skeleton className="mx-auto h-10 w-40" />
        </div>
      )}

      {state === "ok" && (
        <div
          className="mermaid-host overflow-auto rounded-md p-4"
          role="img"
          aria-label={t.ariaLabel[kind]}
          // The SVG comes from Mermaid with securityLevel "strict" (sanitised content).
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}

      {state === "error" && (
        <Alert variant="error" title={t.failedTitle}>
          <p>{t.failedBody}</p>
          {analysisId && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={repairWithAi} disabled={repairing}>
                {repairing ? <Spinner /> : <Wand2 />}
                {repairing ? t.repairing : t.repair}
              </Button>
            </div>
          )}
          {repairError && <p className="mt-2 text-xs text-destructive">{repairError}</p>}
        </Alert>
      )}

      <details className="rounded-md border bg-muted/40 text-sm print:hidden">
        <summary className="cursor-pointer select-none px-3 py-2 text-muted-foreground">{t.showSource}</summary>
        <div className="relative border-t">
          <Button variant="ghost" size="sm" className="absolute right-2 top-2" onClick={copy}>
            {copied ? <Check className="vd-pulse" /> : <Copy />} {copied ? messages.common.copied : messages.common.copy}
          </Button>
          <pre className="overflow-auto p-3 pr-24 font-mono text-xs leading-relaxed">{source}</pre>
          {state === "error" && parserError && <pre className="overflow-auto border-t p-3 font-mono text-xs text-destructive">{parserError.slice(0, 600)}</pre>}
        </div>
      </details>
    </div>
  );
}
