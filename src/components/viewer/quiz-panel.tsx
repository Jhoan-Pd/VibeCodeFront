"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Spinner } from "@/components/ui/misc";
import { messages } from "@/i18n";
import type { Answers } from "@/lib/quiz-ui";
import type { QuizResult, QuizView } from "@/types/analysis-view";
import type { GoToLines } from "./line-range-button";
import { MissingStage } from "./missing-stage";
import { QuizQuestion } from "./quiz/quiz-question";
import { PreviousAttempts, QuizSummary } from "./quiz/quiz-summary";
import { useQuiz, type Grader } from "./quiz/use-quiz";

const t = messages.viewer.quiz;

export interface QuizPanelProps {
  quiz: QuizView | null;
  goToLines: GoToLines;
  /** Own analysis: graded by the backend, and another quiz can be generated. */
  analysisId?: string;
  /** Landing demo: graded in the browser with the sample answers. */
  gradeLocally?: (answers: Answers) => QuizResult;
}

function graderFor({ analysisId, gradeLocally }: Pick<QuizPanelProps, "analysisId" | "gradeLocally">): Grader {
  if (gradeLocally) return { kind: "local", grade: gradeLocally };
  if (analysisId) return { kind: "server", analysisId };
  return { kind: "none" };
}

/** Quiz container: the state lives in useQuiz and every visual part in its own component. */
export function QuizPanel({ quiz, goToLines, analysisId, gradeLocally }: QuizPanelProps) {
  const q = useQuiz(quiz, graderFor({ analysisId, gradeLocally }));

  if (!quiz || quiz.questions.length === 0) return <MissingStage message={t.missing} stage="quiz" action={t.generate} analysisId={analysisId} />;

  return (
    <div className="space-y-4">
      {q.result ? (
        <QuizSummary result={q.result} goToLines={goToLines} onRetry={q.reset} analysisId={analysisId} />
      ) : (
        <p className="text-sm text-muted-foreground">{t.intro(quiz.questions.length)}</p>
      )}

      <ol className="space-y-3">
        {quiz.questions.map((question, i) => (
          <li key={question.id}>
            <QuizQuestion
              number={i + 1}
              question={question}
              answer={q.answers[question.id] ?? null}
              result={q.resultById.get(question.id)}
              onAnswer={(value) => q.answer(question.id, value)}
              goToLines={goToLines}
            />
          </li>
        ))}
      </ol>

      {q.error && <Alert variant="error">{q.error}</Alert>}

      {!q.result && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={q.submit} disabled={q.submitting || q.unanswered > 0}>
            {q.submitting ? <Spinner /> : <Send />}
            {q.submitting ? t.grading : t.submit}
          </Button>
          {q.unanswered > 0 && <span className="text-xs text-muted-foreground">{t.unanswered(q.unanswered)}</span>}
        </div>
      )}

      {quiz.attempts.length > 0 && !gradeLocally && <PreviousAttempts attempts={quiz.attempts} />}
    </div>
  );
}
