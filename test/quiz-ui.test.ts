import { describe, expect, it } from "vitest";
import { messages } from "@/i18n";
import { countUnanswered, describeAnswer, initialAnswers, moveStep, optionState } from "@/lib/quiz-ui";
import type { PublicQuestion, QuestionResult } from "@/types/analysis-view";

const question = (id: string, kind: PublicQuestion["kind"], options: string[] | null = null): PublicQuestion => ({
  id,
  position: 0,
  kind,
  prompt: "?",
  options,
  lineStart: null,
  lineEnd: null,
  concept: null,
});

describe("quiz UI logic", () => {
  const questions = [question("a", "TRUE_FALSE"), question("b", "ORDERING", ["x", "y", "z"]), question("c", "MULTIPLE_CHOICE", ["1", "2"])];

  it("ORDERING starts answered with the displayed order; the rest unanswered", () => {
    const answers = initialAnswers(questions);
    expect(answers).toEqual({ a: null, b: [0, 1, 2], c: null });
    expect(countUnanswered(questions, answers)).toBe(2);
    expect(countUnanswered(questions, { ...answers, a: false, c: 0 })).toBe(0);
  });

  it("the 'unanswered' message agrees in number", () => {
    expect(messages.viewer.quiz.unanswered(1)).toBe("Te falta 1 pregunta.");
    expect(messages.viewer.quiz.unanswered(3)).toBe("Te faltan 3 preguntas.");
  });

  it("moveStep swaps with the neighbour and never leaves the edges", () => {
    expect(moveStep([0, 1, 2], 0, 1)).toEqual([1, 0, 2]);
    expect(moveStep([0, 1, 2], 2, -1)).toEqual([0, 2, 1]);
    const order = [0, 1];
    expect(moveStep(order, 0, -1)).toBe(order);
  });

  it("describes every kind of answer", () => {
    expect(describeAnswer({ options: null }, true)).toBe("Verdadero");
    expect(describeAnswer({ options: ["uno", "dos"] }, 1)).toBe("B. dos");
    expect(describeAnswer({ options: ["x", "y"] }, [1, 0])).toBe("1) y  2) x");
  });

  it("optionState marks the right option and a wrong pick", () => {
    const result = { correctAnswer: 1 } as QuestionResult;
    expect(optionState(undefined, 1, true)).toBe("neutral");
    expect(optionState(result, 1, false)).toBe("correct");
    expect(optionState(result, 0, true)).toBe("wrong");
    expect(optionState(result, 0, false)).toBe("neutral");
  });
});
