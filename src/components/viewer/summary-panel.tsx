import { BookOpen, FileInput, FileOutput, Package } from "lucide-react";
import { InlineCodeText } from "@/components/inline-code-text";
import { RegenerateStageButton } from "@/components/regenerate-stage-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { messages } from "@/i18n";
import type { Summary } from "@/types/analysis-view";

const t = messages.viewer.summary;

/** Purpose, inputs, outputs and dependencies of the code. */
export function SummaryCard({ summary }: { summary: Summary }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-4 text-primary" /> {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="leading-relaxed">
          <InlineCodeText text={summary.purpose} />
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryList icon={<FileInput className="size-4" />} title={t.inputs} items={summary.inputs} />
          <SummaryList icon={<FileOutput className="size-4" />} title={t.outputs} items={summary.outputs} />
          <SummaryList icon={<Package className="size-4" />} title={t.dependencies} items={summary.dependencies} />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-background/50 p-3">
      <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.none}</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>
                <InlineCodeText text={item} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MissingSummary({ analysisId }: { analysisId?: string }) {
  if (!analysisId) return null;
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
        <span className="text-muted-foreground">{t.missing}</span>
        <RegenerateStageButton analysisId={analysisId} stage="summary">
          {t.generate}
        </RegenerateStageButton>
      </CardContent>
    </Card>
  );
}
