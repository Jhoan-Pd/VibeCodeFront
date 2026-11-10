"use client";

import { Bug, FileX2, Ghost, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { InlineCodeText } from "@/components/inline-code-text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { staggerDelay } from "@/lib/motion";
import { SEVERITY_BADGE, SEVERITY_ORDER } from "@/lib/severity";
import type { FindingKind, FindingView } from "@/types/analysis-view";
import { LineRangeButton, type GoToLines } from "./line-range-button";
import { MissingStage } from "./missing-stage";

const t = messages.viewer.audit;
const { labels } = messages;

const ICON: Record<FindingKind, React.ComponentType<{ className?: string }>> = {
  SECURITY: ShieldAlert,
  BAD_PRACTICE: TriangleAlert,
  DEAD_CODE: FileX2,
  ERROR_HANDLING: Bug,
  HALLUCINATION: Ghost,
};

/**
 * "Vibe code" audit. `audited` tells "no findings" (clean code) apart from "the audit does not exist yet"
 * (it failed, or the analysis is older than the audit stage).
 */
export function AuditPanel({ findings, audited, goToLines, analysisId }: { findings: FindingView[]; audited: boolean; goToLines: GoToLines; analysisId?: string }) {
  if (!audited) return <MissingStage message={t.missing} stage="audit" action={t.generate} analysisId={analysisId} />;

  const counts = SEVERITY_ORDER.map((s) => ({ s, n: findings.filter((f) => f.severity === s).length })).filter((x) => x.n > 0);

  return (
    <div className="space-y-4">
      {findings.length === 0 ? (
        <Alert variant="success" title={t.cleanTitle}>
          {t.cleanBody}
        </Alert>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t.count(findings.length)}</span>
          {counts.map(({ s, n }) => (
            <Badge key={s} variant={SEVERITY_BADGE[s]}>
              {t.severityCount(n, labels.severity[s])}
            </Badge>
          ))}
        </div>
      )}

      <ul className="space-y-3" aria-label={t.ariaLabel}>
        {findings.map((f, i) => {
          const Icon = ICON[f.kind];
          return (
            <li key={`${f.title}-${i}`} className="vd-card-enter" style={staggerDelay(i, 60)}>
              <Card className={f.severity === "CRITICAL" ? "border-destructive/50" : undefined}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug">{f.title}</h3>
                        <p className="text-xs text-muted-foreground">{labels.findingKind[f.kind]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <LineRangeButton start={f.lineStart} end={f.lineEnd} goToLines={goToLines} />
                      <Badge variant={SEVERITY_BADGE[f.severity]}>{labels.severity[f.severity]}</Badge>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <InlineCodeText text={f.description} />
                  </p>
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <ShieldCheck className="size-3.5" /> {t.suggestion}
                    </p>
                    <p className="leading-relaxed">
                      <InlineCodeText text={f.suggestion} />
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{t.disclaimer}</p>
    </div>
  );
}
