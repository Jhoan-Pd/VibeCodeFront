import { describe, expect, it } from "vitest";
import { applyEvent, INITIAL_PROGRESS, outcomeOf, type ProgressAction } from "@/lib/analysis-progress";

const replay = (events: ProgressAction[]) => events.reduce(applyEvent, INITIAL_PROGRESS);

describe("analysis progress reducer", () => {
  it("a completed analysis opens the results page", () => {
    const p = replay([
      { type: "started", analysisId: "a1" },
      { type: "stage", stage: "summary", status: "running", message: null },
      { type: "stage", stage: "summary", status: "done", message: null },
      { type: "stage", stage: "quiz", status: "failed", message: "Límite" },
      { type: "finished", analysisId: "a1", status: "COMPLETED", message: null, fromCache: false },
    ]);
    expect(p.stages.summary).toBe("done");
    expect(p.stages.quiz).toBe("failed");
    expect(p.stages.lines).toBe("pending");
    expect(p.stageMessages).toEqual({ quiz: "Límite" });
    expect(outcomeOf(p)).toEqual({ kind: "open", url: "/analysis/a1" });
  });

  it("a cache hit adds ?cache=1", () => {
    const p = replay([{ type: "finished", analysisId: "c", status: "COMPLETED", message: null, fromCache: true }]);
    expect(outcomeOf(p)).toEqual({ kind: "open", url: "/analysis/c?cache=1" });
  });

  it("a failure keeps the id so the saved analysis can be linked", () => {
    const p = replay([{ type: "started", analysisId: "x" }, { type: "finished", analysisId: "x", status: "FAILED", message: "Sin cupo", fromCache: false }]);
    expect(outcomeOf(p)).toEqual({ kind: "error", message: "Sin cupo", analysisId: "x" });
  });

  it("a transport error before the analysis exists is reported without an id", () => {
    const p = replay([{ type: "transportError", message: "No hay conexión" }]);
    expect(outcomeOf(p)).toEqual({ kind: "error", message: "No hay conexión", analysisId: null });
  });

  it("warns when the stream ends without an id", () => {
    expect(outcomeOf(INITIAL_PROGRESS)).toMatchObject({ kind: "error", analysisId: null });
  });

  it("does not mutate the previous state", () => {
    const before = INITIAL_PROGRESS;
    applyEvent(before, { type: "stage", stage: "summary", status: "done", message: null });
    expect(before.stages.summary).toBe("pending");
  });
});
