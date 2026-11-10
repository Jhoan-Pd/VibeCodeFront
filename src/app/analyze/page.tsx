import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnalyzeForm } from "@/components/analyze-form";
import { messages } from "@/i18n";
import { getProfile, getQuota } from "@/lib/rpc/queries";

const t = messages.analyze;

export const metadata: Metadata = { title: t.metaTitle };

/** New analysis: SSR for the person's default level and today's quota; the form itself is a Client Component. */
export default async function AnalyzePage() {
  const [user, quota] = await Promise.all([getProfile(), getQuota().catch(() => null)]);
  if (!user) redirect("/login");

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="vd-title text-3xl sm:text-4xl">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.lead}</p>
      </div>
      <AnalyzeForm initialLevel={user.level} quota={quota?.analyses ?? null} />
    </div>
  );
}
