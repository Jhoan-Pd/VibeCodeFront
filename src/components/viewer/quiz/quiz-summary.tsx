"use client";

import { GraduationCap, RotateCcw } from "lucide-react";
import { RegenerateStageButton } from "@/components/regenerate-stage-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { messages } from "@/i18n";
import { cn, formatDateTime } from "@/lib/utils";
import { PASS_MARK, type AttemptView, type QuizResult } from "@/types/analysis-view";
import { LineRangeButton, type GoToLines } from "../line-range-button";

const t = messages.viewer.quiz;

/** Score, comprehension level and lines to review after grading. */
export function QuizSummary({ result, goToLines, onRetry, analysisId }: { result: QuizResult; goToLines: GoToLines; onRetry: () => void; analysisId?: string }) {
  const passed = result.scorePercent >= PASS_MARK;
  return (
    <Card className={cn("vd-pop", passed ? "border-emerald-500/40" : "border-amber-500/40")}>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-3">
          <GraduationCap className="size-5 text-primary" />
          <span className="tabular-nums">{result.scorePercent}%</span>
          <Badge variant={passed ? "success" : "warning"}>{t.comprehension(messages.labels.comprehension[result.comprehension])}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          {t.score(result.correctCount, result.total)} {passed ? t.passed : t.notPassed}
        </p>
        {result.review.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">{t.reviewTitle}</p>
            <ul className="flex flex-wrap gap-2">
              {result.review.map((r) => (
                <li key={`${r.lineStart}-${r.lineEnd}`}>
                  <LineRangeButton start={r.lineStart} end={r.lineEnd} goToLines={goToLines} text={r.concept ?? t.review} />
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw /> {t.tryAgain}
          </Button>
          {analysisId && (
            <RegenerateStageButton analysisId={analysisId} stage="quiz">
              {t.newQuiz}
            </RegenerateStageButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** The person's latest attempts at this quiz. */
export function PreviousAttempts({ attempts }: { attempts: AttemptView[] }) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.previousAttempts}</h4>
      <ul className="space-y-1 text-sm">
        {attempts.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{formatDateTime(a.createdAt)}</span>
            <span className="tabular-nums">
              {a.scorePercent}% · {messages.labels.comprehension[a.comprehension]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
