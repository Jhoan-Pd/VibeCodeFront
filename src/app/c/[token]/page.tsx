import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Printer } from "lucide-react";
import { AnalysisViewer } from "@/components/analysis-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { languageLabel } from "@/lib/language";
import { getSharedAnalysis } from "@/lib/rpc/queries";
import { isValidShareToken } from "@/lib/share";
import { formatDateTime } from "@/lib/utils";

const t = messages.shared;

/**
 * Public read-only link: ISR. No page is built ahead of time (generateStaticParams returns nothing);
 * the first visit renders it on the server and it is then served from cache and regenerated in the
 * background at most every 60 seconds. A revoked link disappears after that window. The backend call is
 * an HTTP GET with public cache headers (GetSharedAnalysis is NO_SIDE_EFFECTS in the contract).
 */
// A literal (Next reads it statically); keep it equal to SHARED_REVALIDATE_SECONDS in lib/rpc/queries.ts.
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams(): { token: string }[] {
  return [];
}

// Shared links must not show up in search engines.
export const metadata: Metadata = { title: t.metaTitle, robots: { index: false, follow: false } };

export default async function SharedAnalysisPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isValidShareToken(token)) notFound();
  const analysis = await getSharedAnalysis(token);
  if (!analysis) notFound();

  return (
    <div className="container space-y-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h1 className="vd-title break-words text-3xl sm:text-4xl">{analysis.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">
              <Eye className="size-3" /> {t.readOnly}
            </Badge>
            <Badge variant="outline">{languageLabel(analysis.view.language)}</Badge>
            <Badge variant="outline">{messages.analysis.level(messages.labels.level[analysis.level].label)}</Badge>
            <span>{formatDateTime(analysis.createdAt)}</span>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/c/${token}/print`}>
            <Printer /> {t.print}
          </Link>
        </Button>
      </div>

      <Alert variant="info" title={t.noticeTitle}>
        {t.noticeBefore}
        <Link href="/register" className="font-medium underline">
          {t.noticeLink}
        </Link>
        {t.noticeAfter}
      </Alert>

      <AnalysisViewer view={analysis.view} audited={analysis.audited} readOnly />
    </div>
  );
}
