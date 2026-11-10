import { uniqueBy } from "@/lib/collections";
import {
  PASS_MARK,
  type AnswerValue,
  type ComprehensionLevel,
  type PublicQuestion,
  type QuestionKind,
  type QuestionResult,
  type QuizResult,
} from "@/types/analysis-view";

/**
 * Quiz logic for the landing demo, which runs without an account and grades in the browser (its answers
 * are public, there is nothing to protect). It follows the backend rules in domain/quiz.ts; real quizzes
 * are always graded by the backend's QuizService.
 */

/** A demo question as authored: the same shape the LLM produces. */
export type DemoQuestionInput = {
  prompt: string;
  explanation: string;
  lineStart: number | null;
  lineEnd: number | null;
  concept: string | null;
} & ({ kind: "TRUE_FALSE"; correct: boolean } | { kind: "ORDERING"; steps: string[] } | { kind: Exclude<QuestionKind, "TRUE_FALSE" | "ORDERING">; options: string[]; correct: number });

export interface DemoQuestion extends PublicQuestion {
  correctAnswer: AnswerValue;
  explanation: string;
}

/** FNV-1a hash of a string, used as a PRNG seed. */
function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: tiny seeded PRNG returning numbers in [0, 1). */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic permutation of 0..n-1 that is never the identity, so ORDERING never starts solved. */
export function shuffleNonIdentity(n: number, seed: string): number[] {
  const indices = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return indices;
  const random = mulberry32(seedFrom(seed));
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  if (indices.every((v, i) => v === i)) indices.push(indices.shift()!);
  return indices;
}

export function prepareDemoQuestions(questions: readonly DemoQuestionInput[]): DemoQuestion[] {
  return questions.map((q, position) => {
    const base = { id: `demo-${position + 1}`, position, kind: q.kind, prompt: q.prompt, explanation: q.explanation, lineStart: q.lineStart, lineEnd: q.lineEnd, concept: q.concept };
    if (q.kind === "TRUE_FALSE") return { ...base, options: null, correctAnswer: q.correct };
    if (q.kind === "ORDERING") {
      // permutation[k] = original (correct) index of the step shown at position k; the answer is its inverse.
      const permutation = shuffleNonIdentity(q.steps.length, q.prompt + q.steps.join("|"));
      const inverse = new Array<number>(permutation.length);
      permutation.forEach((original, shown) => (inverse[original] = shown));
      return { ...base, options: permutation.map((i) => q.steps[i]), correctAnswer: inverse };
    }
    return { ...base, options: q.options, correctAnswer: q.correct };
  });
}

/** What the browser may see before answering (never the key). */
export const toPublicQuestion = ({ correctAnswer: _key, explanation: _explanation, ...question }: DemoQuestion): PublicQuestion => question;

function isCorrect(q: DemoQuestion, answer: AnswerValue | null): boolean {
  if (answer === null) return false;
  const key = q.correctAnswer;
  if (Array.isArray(key)) return Array.isArray(answer) && answer.length === key.length && answer.every((v, i) => v === key[i]);
  return answer === key;
}

function comprehensionLevel(scorePercent: number): ComprehensionLevel {
  if (scorePercent >= 90) return "EXCELLENT";
  if (scorePercent >= PASS_MARK) return "GOOD";
  if (scorePercent >= 50) return "PARTIAL";
  return "INSUFFICIENT";
}

/** Grades an attempt; unanswered questions count as wrong and, below the pass mark, lists lines to review. */
export function gradeDemoQuiz(questions: readonly DemoQuestion[], answers: Record<string, AnswerValue | null>): QuizResult {
  const results: QuestionResult[] = questions.map((q) => {
    const answer = answers[q.id] ?? null;
    return { questionId: q.id, correct: isCorrect(q, answer), userAnswer: answer, correctAnswer: q.correctAnswer, explanation: q.explanation, lineStart: q.lineStart, lineEnd: q.lineEnd, concept: q.concept };
  });
  const total = results.length;
  const correctCount = results.filter((r) => r.correct).length;
  const scorePercent = total === 0 ? 0 : Math.round((correctCount / total) * 1000) / 10;
  const failed = results.flatMap((r) => (r.correct || r.lineStart == null ? [] : [{ lineStart: r.lineStart, lineEnd: r.lineEnd ?? r.lineStart, concept: r.concept }]));
  const review = scorePercent < PASS_MARK ? uniqueBy(failed, (r) => `${r.lineStart}-${r.lineEnd}`).sort((a, b) => a.lineStart - b.lineStart) : [];
  return { correctCount, total, scorePercent, comprehension: comprehensionLevel(scorePercent), results, review };
}
