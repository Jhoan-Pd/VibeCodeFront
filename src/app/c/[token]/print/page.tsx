import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { PrintView } from "@/components/print/print-view";
import { messages } from "@/i18n";
import { getSharedAnalysis } from "@/lib/rpc/queries";
import { isValidShareToken } from "@/lib/share";

/** Same ISR policy as the public page it prints. */
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams(): { token: string }[] {
  return [];
}

export const metadata: Metadata = { title: messages.print.sharedMetaTitle, robots: { index: false, follow: false } };

export default async function PrintSharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isValidShareToken(token)) notFound();
  // Like the public page: no quiz (the link is read-only).
  const analysis = await getSharedAnalysis(token);
  if (!analysis) notFound();

  return (
    <div className="container space-y-6 py-8 print:max-w-none print:p-0">
      <PrintToolbar backTo={`/c/${token}`} />
      <PrintView view={analysis.view} title={analysis.title} level={analysis.level} createdAt={analysis.createdAt} />
    </div>
  );
}
