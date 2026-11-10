import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { Spinner } from "@/components/ui/misc";
import { messages } from "@/i18n";
import type { StageState } from "@/lib/analysis-progress";
import { STAGES, type Stage } from "@/types/analysis-view";

/** Per-stage progress (summary, lines, diagrams, glossary, audit and quiz) fed by the Analyze stream. */
export function AnalysisProgress({ stages, stageMessages }: { stages: Record<Stage, StageState>; stageMessages?: Partial<Record<Stage, string>> }) {
  return (
    <ol className="space-y-3" aria-live="polite" aria-label={messages.analyze.progressLabel}>
      {STAGES.map((stage) => {
        const state = stages[stage];
        const { label, detail } = messages.labels.stage[stage];
        return (
          <li key={stage} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-5 items-center justify-center">
              {state === "done" && <CheckCircle2 className="vd-check-in size-5 text-success" />}
              {state === "running" && <Spinner className="size-4 text-primary" />}
              {state === "failed" && <AlertTriangle className="vd-shake size-5 text-destructive" />}
              {state === "pending" && <Circle className="size-5 text-muted-foreground/50" />}
            </span>
            <div>
              <p className={state === "pending" ? "text-sm text-muted-foreground" : "text-sm font-medium"}>{label}</p>
              <p className="text-xs text-muted-foreground">{state === "failed" && stageMessages?.[stage] ? stageMessages[stage] : detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
