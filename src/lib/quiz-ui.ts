import { messages } from "@/i18n";
import type { AnswerValue, PublicQuestion, QuestionResult } from "@/types/analysis-view";

/**
 * Pure logic of the quiz UI (no React), unit tested. The component only paints; this decides the
 * initial state, what is still unanswered and how an answer is described.
 */

export type Answers = Record<string, AnswerValue | null>;
export type OptionState = "neutral" | "correct" | "wrong";

/** ORDERING starts with the displayed order (the server already shuffled it); the rest start unanswered. */
export function initialAnswers(questions: readonly PublicQuestion[]): Answers {
  return Object.fromEntries(questions.map((q) => [q.id, q.kind === "ORDERING" ? (q.options ?? []).map((_, i) => i) : null]));
}

export function countUnanswered(questions: readonly PublicQuestion[], answers: Answers): number {
  return questions.reduce((n, q) => n + (answers[q.id] == null ? 1 : 0), 0);
}

/** Swaps step `position` with its neighbour (`delta` = ±1). Returns the same array past the edges. */
export function moveStep(order: readonly number[], position: number, delta: -1 | 1): readonly number[] {
  const target = position + delta;
  if (target < 0 || target >= order.length) return order;
  const next = [...order];
  [next[position], next[target]] = [next[target], next[position]];
  return next;
}

/** A, B, C… for the options. */
export const optionLetter = (i: number) => String.fromCharCode(65 + i);

/** How an option is painted once graded: the right one green, a wrong pick red. */
export function optionState(result: QuestionResult | undefined, value: AnswerValue, picked: boolean): OptionState {
  if (!result) return "neutral";
  if (result.correctAnswer === value) return "correct";
  return picked ? "wrong" : "neutral";
}

/** Readable text of an answer (for "Respuesta correcta: …"). */
export function describeAnswer(q: Pick<PublicQuestion, "options">, value: AnswerValue): string {
  if (typeof value === "boolean") return value ? messages.labels.trueFalse.true : messages.labels.trueFalse.false;
  if (Array.isArray(value)) return value.map((i, n) => `${n + 1}) ${q.options?.[i] ?? "?"}`).join("  ");
  return `${optionLetter(value)}. ${q.options?.[value] ?? ""}`;
}
