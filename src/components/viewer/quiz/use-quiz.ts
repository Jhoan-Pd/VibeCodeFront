"use client";

import { useState } from "react";
import { create } from "@bufbuild/protobuf";
import { SubmittedAnswerSchema } from "@/gen/vibedecoder/v1/quiz_pb";
import { messages } from "@/i18n";
import { countUnanswered, initialAnswers, type Answers } from "@/lib/quiz-ui";
import { rpc } from "@/lib/rpc/browser";
import { attempt } from "@/lib/rpc/errors";
import { fromProtoQuizResult, toProtoAnswer } from "@/lib/rpc/mappers";
import type { AnswerValue, QuizResult, QuizView } from "@/types/analysis-view";

/** How answers are graded: by the backend (own analysis) or in the browser (landing demo). */
export type Grader = { kind: "server"; analysisId: string } | { kind: "local"; grade: (answers: Answers) => QuizResult } | { kind: "none" };

/**
 * Quiz state (answers, result, submission and error) kept apart from the presentation.
 * The component only calls `answer`, `submit` and `reset`.
 */
export function useQuiz(quiz: QuizView | null, grader: Grader) {
  const questions = quiz?.questions ?? [];
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(questions));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function answer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function submit() {
    if (!quiz) return;
    setError(null);
    if (grader.kind === "local") {
      setResult(grader.grade(answers));
      return;
    }
    if (grader.kind === "none") return;
    setSubmitting(true);
    const r = await attempt(() =>
      rpc.quiz.submitAttempt({
        analysisId: grader.analysisId,
        quizId: quiz.id,
        answers: questions.map((q) => create(SubmittedAnswerSchema, { questionId: q.id, answer: toProtoAnswer(answers[q.id] ?? null) })),
      }),
    );
    setSubmitting(false);
    if (r.ok && r.data.result) setResult(fromProtoQuizResult(r.data.result));
    else setError((!r.ok && r.error) || messages.viewer.quiz.failed);
  }

  function reset() {
    setResult(null);
    setAnswers(initialAnswers(questions));
  }

  return {
    answers,
    result,
    resultById: new Map(result?.results.map((r) => [r.questionId, r])),
    unanswered: countUnanswered(questions, answers),
    submitting,
    error,
    answer,
    submit,
    reset,
  };
}
