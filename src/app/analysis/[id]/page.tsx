import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnalysisActions } from "@/components/analysis-actions";
import { AnalysisViewer } from "@/components/analysis-viewer";
import { AutoRefresh } from "@/components/auto-refresh";
import { DeleteAnalysisButton } from "@/components/delete-analysis-button";
import { RegenerateStageButton } from "@/components/regenerate-stage-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { languageLabel } from "@/lib/language";
import { getAnalysis, listChatMessages } from "@/lib/rpc/queries";
import { formatDateTime } from "@/lib/utils";
import { countLines, spanFromParam } from "@/lib/viewer";
import type { AnalysisDetail, Stage } from "@/types/analysis-view";

const t = messages.analysis;

/** After this long "processing", the analysis is considered stuck (the backend worker died). */
const STUCK_AFTER_MINUTES = 4;

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ cache?: string; l?: string }> };

/** The title in the tab. getAnalysis is wrapped in React's cache: the page reuses this same call. */
export async function generateMetadata({ params }: Pick<Params, "params">): Promise<Metadata> {
  const analysis = await getAnalysis((await params).id);
  return { title: analysis?.title ?? t.metaTitle };
}

function missingStages(a: AnalysisDetail): Stage[] {
  const v = a.view;
  const missing: [boolean, Stage][] = [
    [!v.summary, "summary"],
    [v.blocks.length === 0, "lines"],
    [v.diagrams.length === 0, "diagram"],
    [v.concepts.length === 0, "glossary"],
    [!a.audited, "audit"],
    [!v.quiz, "quiz"],
  ];
  return missing.filter(([isMissing]) => isMissing).map(([, stage]) => stage);
}

/**
 * The analysis: SSR (private, per user) + Client Components. The server fetches the analysis with the
 * user's token and renders the static parts; the viewer hydrates for the interactive ones. The analysis
 * and its chat are requested in parallel; loading.tsx streams a skeleton while they arrive.
 */
export default async function AnalysisPage({ params, searchParams }: Params) {
  const [{ id }, { cache, l }] = await Promise.all([params, searchParams]);
  const [analysis, chatMessages] = await Promise.all([getAnalysis(id), listChatMessages(id)]);
  // Missing or someone else's: the backend answers NOT_FOUND for both, so nothing leaks.
  if (!analysis) notFound();

  const levelLabel = messages.labels.level[analysis.level].label;
  const minutes = (Date.now() - new Date(analysis.createdAt).getTime()) / 60_000;
  const processing = analysis.status === "PROCESSING" && minutes < STUCK_AFTER_MINUTES;
  const stuck = analysis.status === "PROCESSING" && !processing;
  const missing = missingStages(analysis);
  const initialFocus = spanFromParam(l, countLines(analysis.view.code));

  return (
    <div className="container space-y-6 py-8">
      {processing && <AutoRefresh />}

      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard">
            <ArrowLeft /> {t.backToHistory}
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <h1 className="vd-title break-words text-3xl sm:text-4xl">{analysis.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{languageLabel(analysis.view.language)}</Badge>
              <Badge variant="outline">{t.level(levelLabel)}</Badge>
              <span>{formatDateTime(analysis.createdAt)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AnalysisActions analysisId={analysis.id} initialToken={analysis.shareToken} />
            <DeleteAnalysisButton id={analysis.id} redirectTo="/dashboard" />
          </div>
        </div>
      </div>

      {cache === "1" && !processing && (
        <Alert variant="info" title={t.cacheTitle}>
          {t.cacheBody(levelLabel)}
        </Alert>
      )}

      {processing && (
        <Alert variant="info" title={t.processingTitle}>
          {t.processingBody}
        </Alert>
      )}

      {(stuck || analysis.status === "FAILED" || (analysis.status === "COMPLETED" && missing.length > 0 && analysis.errorMessage)) && (
        <Alert variant="error" title={analysis.status === "FAILED" || stuck ? t.failedTitle : t.partialTitle}>
          <p>{analysis.errorMessage ?? t.interrupted}</p>
          {missing.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {missing.map((stage) => (
                <RegenerateStageButton key={stage} analysisId={analysis.id} stage={stage}>
                  {t.regenerate[stage]}
                </RegenerateStageButton>
              ))}
            </div>
          )}
        </Alert>
      )}

      <AnalysisViewer analysisId={analysis.id} view={analysis.view} audited={analysis.audited} chatMessages={chatMessages} initialFocus={initialFocus} />
    </div>
  );
}
