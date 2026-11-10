import { recordFromKeys } from "@/lib/collections";
import { messages } from "@/i18n";
import { STAGES, type AnalysisEvent, type Stage } from "@/types/analysis-view";

/**
 * Progress of an analysis in the browser as a pure REDUCER: every stream event yields a new state.
 * Unit tested without React; the hook only plugs it into useReducer.
 */

export type StageState = "pending" | "running" | "done" | "failed";

export interface AnalysisProgress {
  analysisId: string | null;
  stages: Record<Stage, StageState>;
  stageMessages: Partial<Record<Stage, string>>;
  outcome: "COMPLETED" | "FAILED" | null;
  message: string | null;
  fromCache: boolean;
}

export type ProgressAction = AnalysisEvent | { type: "transportError"; message: string };

export const INITIAL_PROGRESS: AnalysisProgress = {
  analysisId: null,
  stages: recordFromKeys<Stage, StageState>(STAGES, () => "pending"),
  stageMessages: {},
  outcome: null,
  message: null,
  fromCache: false,
};

export function applyEvent(state: AnalysisProgress, e: ProgressAction): AnalysisProgress {
  switch (e.type) {
    case "started":
      return { ...state, analysisId: e.analysisId };
    case "stage":
      return {
        ...state,
        stages: { ...state.stages, [e.stage]: e.status },
        stageMessages: e.message ? { ...state.stageMessages, [e.stage]: e.message } : state.stageMessages,
      };
    case "finished":
      return { ...state, analysisId: e.analysisId, outcome: e.status === "COMPLETED" ? "COMPLETED" : "FAILED", message: e.message, fromCache: e.fromCache };
    case "transportError":
      return { ...state, outcome: "FAILED", message: e.message };
  }
}

/** What to do when the stream ends: open the results, or show the error (with a link if it was saved). */
export type Outcome = { kind: "open"; url: string } | { kind: "error"; message: string; analysisId: string | null };

export function outcomeOf(p: AnalysisProgress): Outcome {
  if (p.outcome === "FAILED") return { kind: "error", message: p.message || messages.analyze.failed, analysisId: p.analysisId };
  // COMPLETED, or the connection dropped while the analysis keeps running on the server: the results page handles it.
  if (p.analysisId) return { kind: "open", url: `/analysis/${p.analysisId}${p.fromCache ? "?cache=1" : ""}` };
  return { kind: "error", message: messages.analyze.connectionLost, analysisId: null };
}
