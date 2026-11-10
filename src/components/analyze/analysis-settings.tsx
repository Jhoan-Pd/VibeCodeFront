"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LevelSelector } from "@/components/level-selector";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { publicConfig } from "@/config/public";
import { messages } from "@/i18n";
import { chosenLanguage, LANGUAGES, languageLabel, type LanguageId, type LanguageOrPlain } from "@/lib/language";
import { cn, formatNumber } from "@/lib/utils";
import type { Level, QuotaView } from "@/types/analysis-view";

const t = messages.analyze.settings;

export interface AnalysisSettingsProps {
  title: string;
  onTitle: (v: string) => void;
  language: LanguageId | "auto";
  onLanguage: (v: LanguageId | "auto") => void;
  /** Detected language; null while there is not enough code to show it. */
  detected: LanguageOrPlain | null;
  level: Level;
  onLevel: (v: Level) => void;
  force: boolean;
  onForce: (v: boolean) => void;
  error: { message: string; analysisId: string | null } | null;
  /** Today's quota of new analyses; null when the backend could not say (the button still works). */
  quota: QuotaView | null;
  tooLong: boolean;
  canAnalyze: boolean;
  onAnalyze: () => void;
}

/** Side panel with title, language, level, cache and the analyze button. */
export function AnalysisSettings(p: AnalysisSettingsProps) {
  const autoSuffix = p.detected ? ` · ${p.detected === "plaintext" ? t.notDetected : languageLabel(p.detected)}` : "";
  return (
    <>
      <CardHeader className="pb-3">
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">{t.titleLabel}</Label>
          <Input id="title" maxLength={120} value={p.title} onChange={(e) => p.onTitle(e.target.value)} placeholder={t.titlePlaceholder} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">{t.language}</Label>
          <Select id="language" value={p.language} onChange={(e) => p.onLanguage(chosenLanguage(e.target.value))}>
            <option value="auto">
              {t.auto}
              {autoSuffix}
            </option>
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t.level}</Label>
          <LevelSelector value={p.level} onChange={p.onLevel} />
        </div>

        {p.error && (
          <Alert key={p.error.message} variant="error" title={t.errorTitle} className="vd-shake">
            {p.error.message}
            {p.error.analysisId && (
              <Link href={`/analysis/${p.error.analysisId}`} className="mt-2 block text-xs text-primary underline">
                {t.viewSaved}
              </Link>
            )}
          </Alert>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 accent-[hsl(var(--primary))]" checked={p.force} onChange={(e) => p.onForce(e.target.checked)} />
          <span>
            {t.ignoreCache}
            <span className="block text-xs text-muted-foreground">{t.ignoreCacheHint}</span>
          </span>
        </label>

        <Button className="w-full" size="lg" onClick={p.onAnalyze} disabled={!p.canAnalyze}>
          <Sparkles /> {t.submit}
        </Button>
        {p.quota && (
          <p className={cn("text-center text-xs", p.quota.remaining === 0 ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
            {p.quota.remaining === 0 ? t.quotaUsed(p.quota.limit) : t.quotaLeft(p.quota.remaining, p.quota.limit)}
          </p>
        )}
        {p.tooLong && <p className="text-xs text-destructive">{t.tooLong(formatNumber(publicConfig.maxCodeChars))}</p>}
      </CardContent>
    </>
  );
}
