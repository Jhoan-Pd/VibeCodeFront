import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { PrintView } from "@/components/print/print-view";
import { messages } from "@/i18n";
import { getAnalysis } from "@/lib/rpc/queries";

export const metadata: Metadata = { title: messages.print.metaTitle };

/** Print view of an own analysis: SSR (private data), almost no client JavaScript. */
export default async function PrintAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = await getAnalysis(id);
  if (!analysis) notFound();

  return (
    <div className="container space-y-6 py-8 print:max-w-none print:p-0">
      <PrintToolbar backTo={`/analysis/${id}`} />
      <PrintView view={analysis.view} title={analysis.title} level={analysis.level} createdAt={analysis.createdAt} />
    </div>
  );
}
