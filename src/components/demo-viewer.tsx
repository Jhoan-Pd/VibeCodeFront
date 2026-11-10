"use client";

import { AnalysisViewer } from "@/components/analysis-viewer";
import { DEMO_QUESTIONS, DEMO_VIEW } from "@/lib/demo/analysis";
import { gradeDemoQuiz } from "@/lib/demo/quiz";

/** Interactive demo of the landing page: pre-computed data, no account and no LLM call. */
export function DemoViewer() {
  return <AnalysisViewer view={DEMO_VIEW} gradeLocally={(answers) => gradeDemoQuiz(DEMO_QUESTIONS, answers)} />;
}
