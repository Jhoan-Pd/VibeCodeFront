"use client";

import { BookMarked } from "lucide-react";
import { InlineCodeText } from "@/components/inline-code-text";
import { Card, CardContent } from "@/components/ui/card";
import { messages } from "@/i18n";
import { staggerDelay } from "@/lib/motion";
import type { ConceptView } from "@/types/analysis-view";
import { LineRangeButton, type GoToLines } from "./line-range-button";
import { MissingStage } from "./missing-stage";

const t = messages.viewer.glossary;

/** Glossary of the concepts used by the code, each one linked to the lines where it appears. */
export function GlossaryPanel({ concepts, goToLines, analysisId }: { concepts: ConceptView[]; goToLines: GoToLines; analysisId?: string }) {
  if (concepts.length === 0) return <MissingStage message={t.missing} stage="glossary" action={t.generate} analysisId={analysisId} />;
  return (
    <ul className="grid gap-3 md:grid-cols-2" aria-label={t.ariaLabel}>
      {concepts.map((c, i) => (
        <li key={c.name} className="vd-card-enter" style={staggerDelay(i, 50)}>
          <Card className="h-full">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <BookMarked className="size-4 shrink-0 text-primary" />
                  {c.name}
                </h3>
                <LineRangeButton start={c.lineStart} end={c.lineEnd} goToLines={goToLines} />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <InlineCodeText text={c.explanation} />
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
