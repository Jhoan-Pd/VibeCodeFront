"use client";

import { useState } from "react";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { cn } from "@/lib/utils";
import type { DiagramKind, DiagramView } from "@/types/analysis-view";
import { MissingStage } from "./missing-stage";

const t = messages.viewer.diagrams;

/** Diagrams of the analysis: always a flow chart; class and sequence only when the LLM found them useful. */
export function DiagramsPanel({ diagrams, analysisId }: { diagrams: DiagramView[]; analysisId?: string }) {
  const [kind, setKind] = useState<DiagramKind>(diagrams[0]?.kind ?? "FLOW");

  if (diagrams.length === 0) return <MissingStage message={t.missing} stage="diagram" action={t.generate} analysisId={analysisId} />;

  return (
    <div className="space-y-3">
      {diagrams.length > 1 && <Tabs value={kind} onChange={setKind} items={diagrams.map((d) => ({ id: d.kind, label: messages.labels.diagramKind[d.kind] }))} />}
      {/* All mounted: Mermaid does not redraw when switching tabs. */}
      {diagrams.map((d) => (
        <Card key={d.kind} className={cn(d.kind !== kind && "hidden")}>
          <CardHeader className="pb-2">
            <CardTitle>{d.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <MermaidDiagram source={d.mermaid} analysisId={analysisId} kind={d.kind} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
