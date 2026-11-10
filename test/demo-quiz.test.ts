import { describe, expect, it } from "vitest";
import { DEMO_QUESTIONS, DEMO_VIEW } from "@/lib/demo/analysis";
import { gradeDemoQuiz, shuffleNonIdentity } from "@/lib/demo/quiz";
import { countLines } from "@/lib/viewer";

describe("landing demo", () => {
  it("uses the same view model as a real analysis, with ranges inside the code", () => {
    const lines = countLines(DEMO_VIEW.code);
    for (const b of DEMO_VIEW.blocks) expect(b.lineStart >= 1 && b.lineEnd <= lines && b.lineStart <= b.lineEnd).toBe(true);
    for (const r of [...DEMO_VIEW.concepts, ...DEMO_VIEW.findings]) if (r.lineStart != null) expect(r.lineEnd! <= lines).toBe(true);
  });

  it("the public quiz never carries the answers", () => {
    const json = JSON.stringify(DEMO_VIEW.quiz);
    expect(json).not.toContain("correctAnswer");
    for (const q of DEMO_QUESTIONS) expect(json).not.toContain(q.explanation);
  });

  it("all correct answers score 100 % with nothing to review", () => {
    const answers = Object.fromEntries(DEMO_QUESTIONS.map((q) => [q.id, q.correctAnswer]));
    const result = gradeDemoQuiz(DEMO_QUESTIONS, answers);
    expect(result).toMatchObject({ correctCount: DEMO_QUESTIONS.length, scorePercent: 100, comprehension: "EXCELLENT", review: [] });
  });

  it("unanswered questions count as wrong and list the lines to review", () => {
    const result = gradeDemoQuiz(DEMO_QUESTIONS, {});
    expect(result.scorePercent).toBe(0);
    expect(result.comprehension).toBe("INSUFFICIENT");
    expect(result.review.length).toBeGreaterThan(0);
  });

  it("ORDERING never starts already solved", () => {
    for (let n = 2; n < 8; n++) expect(shuffleNonIdentity(n, `seed-${n}`)).not.toEqual(Array.from({ length: n }, (_, i) => i));
  });
});
