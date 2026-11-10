import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FileCode2, Plus, TrendingUp } from "lucide-react";
import { DeleteAnalysisButton } from "@/components/delete-analysis-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { languageLabel } from "@/lib/language";
import { listAnalyses } from "@/lib/rpc/queries";
import { formatDateTime } from "@/lib/utils";
import type { AnalysisStatus } from "@/types/analysis-view";

const t = messages.dashboard;

export const metadata: Metadata = { title: t.metaTitle };

const STATUS_BADGE: Record<AnalysisStatus, "success" | "warning" | "secondary" | "destructive"> = {
  COMPLETED: "success",
  PROCESSING: "warning",
  PENDING: "secondary",
  FAILED: "destructive",
};

/**
 * History: SSR with streaming. The header is sent right away and the list streams in through Suspense
 * when the backend answers (a sleeping free-tier backend can take a while; the page never sits blank).
 */
export default function DashboardPage() {
  return (
    <div className="container space-y-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="vd-title text-3xl sm:text-4xl">{t.title}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/progress">
              <TrendingUp /> {t.myProgress}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/analyze">
              <Plus /> {t.newAnalysis}
            </Link>
          </Button>
        </div>
      </div>
      <Suspense fallback={<HistorySkeleton />}>
        <History />
      </Suspense>
    </div>
  );
}

async function History() {
  const analyses = await listAnalyses();

  if (analyses.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-4 border-dashed p-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileCode2 />
        </span>
        <div>
          <h2 className="font-medium">{t.emptyTitle}</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t.emptyBody}</p>
        </div>
        <Button asChild>
          <Link href="/analyze">{t.emptyAction}</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.count(analyses.length)}</p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {analyses.map((a) => (
          <li key={a.id}>
            <Card className="flex h-full flex-col justify-between gap-3 p-4 transition-colors hover:border-primary/40">
              <Link href={`/analysis/${a.id}`} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-sm font-semibold leading-snug">{a.title}</h2>
                  <Badge variant={STATUS_BADGE[a.status]} className="shrink-0">
                    {t.status[a.status]}
                  </Badge>
                </div>
                <pre className="line-clamp-3 overflow-hidden whitespace-pre-wrap break-all rounded-md bg-muted/60 p-2 font-mono text-[11px] leading-snug text-muted-foreground">
                  {a.codePreview}
                </pre>
              </Link>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline">{languageLabel(a.language)}</Badge>
                  <Badge variant="outline">{messages.labels.level[a.level].label}</Badge>
                  <span>{formatDateTime(a.createdAt)}</span>
                </div>
                <DeleteAnalysisButton id={a.id} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label={t.loading}>
      <Skeleton className="h-4 w-40" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
