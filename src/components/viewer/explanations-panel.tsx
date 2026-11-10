"use client";

import type { MutableRefObject } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { InlineCodeText } from "@/components/inline-code-text";
import { Badge } from "@/components/ui/badge";
import { messages } from "@/i18n";
import { cn } from "@/lib/utils";
import type { LineSpan } from "@/lib/viewer";
import type { Block } from "@/types/analysis-view";
import { lineRangeLabel } from "./line-range-button";
import { MissingStage } from "./missing-stage";

const t = messages.viewer.explanations;

export interface ExplanationsPanelProps {
  blocks: Block[];
  active: number | null;
  onActivate: (i: number) => void;
  /** Panel items, so the editor can scroll the panel to the active block. */
  itemsRef: MutableRefObject<(HTMLElement | null)[]>;
  /** When given, every block offers "Ask about these lines". */
  onAsk?: (span: LineSpan) => void;
  analysisId?: string;
  className?: string;
}

/** List of block explanations, synchronised with the editor. */
export function ExplanationsPanel({ blocks, active, onActivate, itemsRef, onAsk, analysisId, className }: ExplanationsPanelProps) {
  if (blocks.length === 0) {
    return (
      <div className={className}>
        <MissingStage message={t.missing} stage="lines" action={t.generate} analysisId={analysisId} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} aria-label={t.ariaLabel}>
      {blocks.map((b, i) => {
        const isActive = active === i;
        return (
          <article
            key={`${b.lineStart}-${i}`}
            ref={(el) => {
              itemsRef.current[i] = el;
            }}
            tabIndex={0}
            aria-current={isActive}
            onMouseEnter={() => onActivate(i)}
            onFocus={() => onActivate(i)}
            onClick={() => onActivate(i)}
            className={cn("cursor-default rounded-lg border bg-card p-4 transition-colors", isActive ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40")}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <h4 className="text-sm font-semibold leading-snug">{b.title}</h4>
              <Badge variant={isActive ? "default" : "secondary"} className="shrink-0 font-mono">
                {lineRangeLabel(b.lineStart, b.lineEnd)}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <InlineCodeText text={b.explanation} />
            </p>
            {onAsk && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAsk({ start: b.lineStart, end: b.lineEnd });
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <MessageCircleQuestion className="size-3.5" /> {t.ask}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
