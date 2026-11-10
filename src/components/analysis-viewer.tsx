"use client";

import { useCallback, useMemo, useState } from "react";
import { BookMarked, Code2, GitBranch, GraduationCap, MessageCircleQuestion, ShieldAlert } from "lucide-react";
import { MonacoEditor, VIEWER_OPTIONS } from "@/components/code-editor";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/misc";
import { AuditPanel } from "@/components/viewer/audit-panel";
import { ChatPanel } from "@/components/viewer/chat-panel";
import { DiagramsPanel } from "@/components/viewer/diagrams-panel";
import { ExplanationsPanel } from "@/components/viewer/explanations-panel";
import { GlossaryPanel } from "@/components/viewer/glossary-panel";
import { QuizPanel, type QuizPanelProps } from "@/components/viewer/quiz-panel";
import { MissingSummary, SummaryCard } from "@/components/viewer/summary-panel";
import { useSyncedEditor } from "@/components/viewer/use-synced-editor";
import { useIsDark } from "@/hooks/use-is-dark";
import { messages } from "@/i18n";
import { languageLabel } from "@/lib/language";
import { cn } from "@/lib/utils";
import { countLines, type LineSpan } from "@/lib/viewer";
import type { AnalysisView, ChatMessageView } from "@/types/analysis-view";

const t = messages.viewer;

export interface AnalysisViewerProps {
  view: AnalysisView;
  /** When given: "Retry", "Fix diagram with AI" and server-graded quizzes are enabled. */
  analysisId?: string;
  /** false while the audit has not run (so "no findings" is never shown by mistake). */
  audited?: boolean;
  /** Demo only: grades the quiz in the browser. */
  gradeLocally?: QuizPanelProps["gradeLocally"];
  /** Public read-only view: hides the quiz and the chat. */
  readOnly?: boolean;
  /** Previous messages of the contextual chat (own analyses only). */
  chatMessages?: ChatMessageView[];
  /** Range to highlight on open (the "review" links of the progress dashboard: ?l=3-9). */
  initialFocus?: LineSpan | null;
}

type Tab = "code" | "diagrams" | "glossary" | "audit" | "quiz";
type RightPanel = "explanation" | "chat";

/**
 * The interactive viewer (a Client Component). The page renders the analysis on the server and hands it
 * over as serialisable props; everything here is interaction: tabs, the synced editor, chat and quiz.
 */
export function AnalysisViewer({ view, analysisId, audited = true, gradeLocally, readOnly = false, chatMessages = [], initialFocus = null }: AnalysisViewerProps) {
  const { code, language, summary, blocks, diagrams, concepts, findings, quiz } = view;
  const dark = useIsDark();
  const [tab, setTab] = useState<Tab>("code");
  const [panel, setPanel] = useState<RightPanel>("explanation");
  const lineCount = useMemo(() => countLines(code), [code]);

  const showCode = useCallback(() => setTab("code"), []);
  const editor = useSyncedEditor({ blocks, lineCount, initialFocus, onGoToLines: showCode });

  const askAbout = (span: LineSpan) => {
    editor.setSelection(span);
    setPanel("chat");
  };

  const tabs = [
    { id: "code" as const, label: <><Code2 className="size-4" /> {t.tabs.code}</> },
    { id: "diagrams" as const, label: <><GitBranch className="size-4" /> {t.tabs.diagrams}{diagrams.length > 1 ? ` (${diagrams.length})` : ""}</> },
    { id: "glossary" as const, label: <><BookMarked className="size-4" /> {t.tabs.glossary}</> },
    { id: "audit" as const, label: <><ShieldAlert className="size-4" /> {t.tabs.audit}{findings.length > 0 ? ` (${findings.length})` : ""}</> },
    ...(readOnly ? [] : [{ id: "quiz" as const, label: <><GraduationCap className="size-4" /> {t.tabs.quiz}</> }]),
  ];

  return (
    <div className="space-y-6">
      {summary ? <SummaryCard summary={summary} /> : <MissingSummary analysisId={analysisId} />}

      <div className="space-y-4">
        <Tabs value={tab} onChange={setTab} items={tabs} />

        {/* Both panels stay mounted (with `hidden`) so Monaco does not reload when switching tabs. */}
        <div ref={editor.containerRef} className={cn("vd-fade scroll-mt-20", tab !== "code" && "hidden")}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground">
                <span className="font-mono">{languageLabel(language)}</span>
                <span>{t.lines(lineCount)}</span>
              </div>
              <div className="h-[44vh] min-h-[320px] lg:h-[70vh]">
                <MonacoEditor value={code} language={language} theme={dark ? "vs-dark" : "light"} options={VIEWER_OPTIONS} onMount={editor.onMount} />
              </div>
            </Card>

            <div className="space-y-3">
              {!readOnly && (
                <Tabs
                  value={panel}
                  onChange={setPanel}
                  className="h-9"
                  items={[
                    { id: "explanation", label: <>{t.rightPanel.explanation}</> },
                    { id: "chat", label: <><MessageCircleQuestion className="size-4" /> {t.rightPanel.chat}</> },
                  ]}
                />
              )}
              {panel === "chat" && !readOnly ? (
                <div className="h-[60vh] lg:h-[calc(70vh-11px)]">
                  <ChatPanel
                    analysisId={analysisId}
                    initialMessages={chatMessages}
                    selection={editor.selection}
                    clearSelection={() => editor.setSelection(null)}
                    goToLines={editor.goToLines}
                  />
                </div>
              ) : (
                <ExplanationsPanel
                  blocks={blocks}
                  active={editor.active}
                  onActivate={(i) => editor.activate(i, "panel")}
                  itemsRef={editor.itemsRef}
                  onAsk={readOnly ? undefined : askAbout}
                  analysisId={analysisId}
                  className={cn("lg:overflow-y-auto lg:pr-1", readOnly ? "lg:h-[calc(70vh+37px)]" : "lg:h-[calc(70vh-11px)]")}
                />
              )}
            </div>
          </div>
          {blocks.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t.syncHint}
              {!readOnly && t.selectHint}
            </p>
          )}
        </div>

        <div className={cn("vd-fade", tab !== "diagrams" && "hidden")}>
          <DiagramsPanel diagrams={diagrams} analysisId={analysisId} />
        </div>

        {tab === "glossary" && (
          <div className="vd-fade">
            <GlossaryPanel concepts={concepts} goToLines={editor.goToLines} analysisId={analysisId} />
          </div>
        )}

        {tab === "audit" && (
          <div className="vd-fade">
            <AuditPanel findings={findings} audited={audited} goToLines={editor.goToLines} analysisId={analysisId} />
          </div>
        )}

        {/* The quiz stays mounted so answers survive a look at the code. */}
        {!readOnly && (
          <div className={cn("vd-fade", tab !== "quiz" && "hidden")}>
            <QuizPanel key={quiz?.id ?? "no-quiz"} quiz={quiz} goToLines={editor.goToLines} analysisId={analysisId} gradeLocally={gradeLocally} />
          </div>
        )}
      </div>
    </div>
  );
}
