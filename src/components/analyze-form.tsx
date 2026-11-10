"use client";

import { useState } from "react";
import { ClipboardPaste, FileUp, Github } from "lucide-react";
import { AnalysisSettings } from "@/components/analyze/analysis-settings";
import { FileSource } from "@/components/analyze/file-source";
import { GistSource } from "@/components/analyze/gist-source";
import { useAnalysis } from "@/components/analyze/use-analysis";
import { useCodeSource } from "@/components/analyze/use-code-source";
import { AnalysisProgress } from "@/components/analysis-progress";
import { EDITOR_OPTIONS, MonacoEditor } from "@/components/code-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, Spinner, Tabs } from "@/components/ui/misc";
import { publicConfig } from "@/config/public";
import { useIsDark } from "@/hooks/use-is-dark";
import { messages } from "@/i18n";
import { cn, formatNumber } from "@/lib/utils";
import type { Level, QuotaView } from "@/types/analysis-view";

const t = messages.analyze;

const SOURCE_TABS = [
  { id: "paste" as const, label: <><ClipboardPaste className="size-4" /> {t.sources.paste}</> },
  { id: "file" as const, label: <><FileUp className="size-4" /> {t.sources.file}</> },
  { id: "gist" as const, label: <><Github className="size-4" /> {t.sources.gist}</> },
];

/**
 * The analysis form. It composes two hooks — where the code comes from (useCodeSource) and the streamed
 * analysis (useAnalysis) — with presentational components for each source and for the settings.
 */
export function AnalyzeForm({ initialLevel, quota }: { initialLevel: Level; quota: QuotaView | null }) {
  const dark = useIsDark();
  const s = useCodeSource();
  const { phase, progress, error, analyze } = useAnalysis();
  const [level, setLevel] = useState<Level>(initialLevel);
  const [force, setForce] = useState(false);

  const length = s.code.length;
  const tooLong = length > publicConfig.maxCodeChars;
  const empty = s.code.trim().length < 3;

  const start = () => analyze({ code: s.code, language: s.language, level, title: s.title || undefined, force });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
          <Tabs value={s.source} onChange={s.setSource} items={SOURCE_TABS} />
          <span className={cn("text-xs tabular-nums", tooLong ? "font-medium text-destructive" : "text-muted-foreground")} aria-live="polite">
            {t.charCount(formatNumber(length), formatNumber(publicConfig.maxCodeChars))}
          </span>
        </div>

        {s.error && (
          <Alert key={s.error} variant="error" className="vd-shake m-3">
            {s.error}
          </Alert>
        )}

        {s.source === "paste" && (
          <div className="relative h-[52vh] min-h-[340px]">
            <MonacoEditor value={s.code} language={s.effectiveLanguage} theme={dark ? "vs-dark" : "light"} options={EDITOR_OPTIONS} onChange={(v) => s.edit(v ?? "")} />
            {length === 0 && <p className="pointer-events-none absolute left-14 top-3 max-w-md text-sm text-muted-foreground/70">{t.placeholder}</p>}
          </div>
        )}

        {s.source === "file" && <FileSource onFile={(file) => void s.readFile(file)} />}

        {s.source === "gist" && <GistSource loading={s.gistLoading} files={s.gistFiles} onLoad={(url) => void s.loadGist(url)} onPick={(f) => s.loadCode(f.content, f.name)} />}
      </Card>

      <Card className="h-fit">
        {phase === "analyzing" ? (
          <>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Spinner className="text-primary" /> {t.analyzing}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnalysisProgress stages={progress.stages} stageMessages={progress.stageMessages} />
              <p className="text-xs text-muted-foreground">{t.analyzingHint}</p>
            </CardContent>
          </>
        ) : (
          <AnalysisSettings
            title={s.title}
            onTitle={s.setTitle}
            language={s.language}
            onLanguage={s.setLanguage}
            detected={!empty && s.language === "auto" ? s.detected : null}
            level={level}
            onLevel={setLevel}
            force={force}
            onForce={setForce}
            error={phase === "error" ? error : null}
            quota={quota}
            tooLong={tooLong}
            canAnalyze={!empty && !tooLong}
            onAnalyze={start}
          />
        )}
      </Card>
    </div>
  );
}
