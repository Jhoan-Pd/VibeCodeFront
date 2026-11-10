import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, CircleDashed, Flame, GraduationCap, Plus, TriangleAlert } from "lucide-react";
import { ScoreChart } from "@/components/progress/score-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { languageLabel } from "@/lib/language";
import { getProgress } from "@/lib/rpc/queries";
import { cn, formatDate } from "@/lib/utils";
import { PASS_MARK, type ConceptProgressView, type MasteryStatus } from "@/types/analysis-view";

const t = messages.progress;

export const metadata: Metadata = { title: t.metaTitle };

/** Same thresholds as the backend (domain/progress.ts), used only to describe the columns. */
const MASTERED_THRESHOLD = 80;
const IN_PROGRESS_THRESHOLD = 50;

const COLUMNS: Record<MasteryStatus, { title: string; description: string; icon: typeof CheckCircle2; className: string }> = {
  needs_review: { title: t.columns.needs_review.title, description: t.columns.needs_review.description(IN_PROGRESS_THRESHOLD), icon: TriangleAlert, className: "text-destructive" },
  in_progress: {
    title: t.columns.in_progress.title,
    description: t.columns.in_progress.description(IN_PROGRESS_THRESHOLD, MASTERED_THRESHOLD),
    icon: CircleDashed,
    className: "text-amber-600 dark:text-amber-400",
  },
  mastered: { title: t.columns.mastered.title, description: t.columns.mastered.description(MASTERED_THRESHOLD), icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
};

/** Progress dashboard: SSR with streaming (the heading first, the computed progress when it arrives). */
export default function ProgressPage() {
  return (
    <div className="container space-y-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="vd-title text-3xl sm:text-4xl">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.lead}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">{t.viewHistory}</Link>
        </Button>
      </div>
      <Suspense fallback={<ProgressSkeleton />}>
        <ProgressContent />
      </Suspense>
    </div>
  );
}

async function ProgressContent() {
  const p = await getProgress();
  const noQuizzes = p.totals.attempts === 0;
  const maxLanguage = Math.max(1, ...p.languages.map((l) => l.count));

  return (
    <>
      <section aria-label={t.summaryLabel} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat title={t.averageScore} value={p.averageScore == null ? "—" : `${p.averageScore} %`} detail={<Trend value={p.trend} />} />
        <Stat title={t.quizzesAnswered} value={String(p.totals.quizzesAnswered)} detail={t.attempts(p.totals.attempts)} />
        <Stat title={t.analyses} value={String(p.totals.analyses)} detail={t.analysesDetail(p.totals.completedAnalyses, p.totals.chatQuestions)} />
        <Stat
          title={t.streak}
          value={t.streakValue(p.streakDays)}
          detail={
            <span className="inline-flex items-center gap-1">
              <Flame className="size-3.5" /> {p.streakDays > 0 ? t.streakActive : t.streakInactive}
            </span>
          }
        />
      </section>

      {noQuizzes ? (
        <Card className="flex flex-col items-center gap-4 border-dashed p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap />
          </span>
          <div>
            <h2 className="font-medium">{t.emptyTitle}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {t.emptyBefore}
              <strong>{t.emptyTab}</strong>
              {t.emptyAfter}
            </p>
          </div>
          <Button asChild>
            <Link href={p.totals.analyses > 0 ? "/dashboard" : "/analyze"}>
              {p.totals.analyses > 0 ? (
                t.pickAnalysis
              ) : (
                <>
                  <Plus /> {t.analyzeCode}
                </>
              )}
            </Link>
          </Button>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.chartTitle}</CardTitle>
              <CardDescription>{t.chartDescription(p.scoreHistory.length)}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreChart points={p.scoreHistory.map((s) => ({ attemptedAt: s.attemptedAt, scorePercent: s.scorePercent, title: s.analysisTitle }))} passMark={PASS_MARK} />
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">{t.asTable}</summary>
                <table className="mt-2 w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="py-1 font-medium">{t.table.date}</th>
                      <th className="py-1 font-medium">{t.table.analysis}</th>
                      <th className="py-1 text-right font-medium">{t.table.score}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...p.scoreHistory].reverse().map((s, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-1.5 pr-3 tabular-nums text-muted-foreground">{formatDate(s.attemptedAt)}</td>
                        <td className="py-1.5 pr-3">
                          <Link href={`/analysis/${s.analysisId}`} className="hover:underline">
                            {s.analysisTitle}
                          </Link>
                        </td>
                        <td className="py-1.5 text-right tabular-nums">{s.scorePercent} %</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </CardContent>
          </Card>

          <section aria-labelledby="concepts-title" className="space-y-3">
            <h2 id="concepts-title" className="text-lg font-semibold">
              {t.concepts}
            </h2>
            {p.concepts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noConcepts}</p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-3">
                {(["needs_review", "in_progress", "mastered"] as const).map((status) => (
                  <ConceptColumn key={status} status={status} concepts={p.concepts.filter((c) => c.status === status)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {p.languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.languages}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {p.languages.map((l) => (
                <li key={l.language} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3 text-sm">
                  <span className="truncate">{languageLabel(l.language)}</span>
                  <span className="h-2 rounded-full bg-muted" aria-hidden>
                    <span className="block h-2 rounded-full bg-primary" style={{ width: `${(l.count / maxLanguage) * 100}%` }} />
                  </span>
                  <span className="text-right tabular-nums text-muted-foreground">{l.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function Stat({ title, value, detail }: { title: string; value: string; detail: React.ReactNode }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </Card>
  );
}

function Trend({ value }: { value: number | null }) {
  if (value == null) return <>{t.trend.none}</>;
  if (Math.abs(value) < 1) return <>{t.trend.stable}</>;
  const up = value > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-3.5" />
      {t.trend.change(up ? "+" : "−", Math.abs(value))}
    </span>
  );
}

function ConceptColumn({ status, concepts }: { status: MasteryStatus; concepts: ConceptProgressView[] }) {
  const column = COLUMNS[status];
  const Icon = column.icon;
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-sm", column.className)}>
          <Icon className="size-4" /> {column.title} <span className="font-normal text-muted-foreground">({concepts.length})</span>
        </CardTitle>
        <CardDescription className="text-xs">{column.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {concepts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noneYet}</p>
        ) : (
          <ul className="space-y-3">
            {concepts.map((c) => (
              <li key={c.name} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{c.masteryPercent} %</span>
                </div>
                <span className="block h-1.5 rounded-full bg-muted" aria-hidden>
                  <span className="block h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(2, c.masteryPercent)}%` }} />
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {t.correctOf(c.correctCount, c.total)}
                    {c.fewAnswers && t.fewAnswers}
                  </span>
                  {c.review && status !== "mastered" && (
                    <Link
                      href={`/analysis/${c.review.analysisId}${c.review.lineStart ? `?l=${c.review.lineStart}-${c.review.lineEnd ?? c.review.lineStart}` : ""}`}
                      className="inline-flex items-center gap-1 hover:text-primary"
                      title={c.review.analysisTitle}
                    >
                      {t.review} <ArrowRight className="size-3" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={t.loading}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72" />
      <div className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
