"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { applyEvent, INITIAL_PROGRESS, outcomeOf, type AnalysisProgress, type ProgressAction } from "@/lib/analysis-progress";
import { streamAnalysis, type AnalyzeInput } from "@/lib/rpc/analyze-stream";
import { rpcErrorMessage } from "@/lib/rpc/errors";

export type Phase = "editing" | "analyzing" | "error";
type Action = { type: "reset" } | ProgressAction;

function reducer(state: AnalysisProgress, action: Action): AnalysisProgress {
  return action.type === "reset" ? INITIAL_PROGRESS : applyEvent(state, action);
}

/**
 * Runs the analysis over the Analyze server stream. Progress comes from the pure `applyEvent` reducer,
 * the final result from `outcomeOf`; this hook only navigates or shows the error.
 */
export function useAnalysis() {
  const router = useRouter();
  const [progress, dispatch] = useReducer(reducer, INITIAL_PROGRESS);
  const [phase, setPhase] = useState<Phase>("editing");
  const [error, setError] = useState<{ message: string; analysisId: string | null } | null>(null);

  async function analyze(input: AnalyzeInput) {
    setPhase("analyzing");
    setError(null);
    dispatch({ type: "reset" });

    // The outcome is computed from the same events, alongside React's (asynchronous) state.
    let final = INITIAL_PROGRESS;
    try {
      await streamAnalysis(input, (event) => {
        final = applyEvent(final, event);
        dispatch(event);
      });
    } catch (e) {
      // The connection dropped after the analysis was created: it keeps running on the server and the
      // results page follows it. Before that, the failure is shown here.
      if (final.analysisId && !final.outcome) {
        router.push(`/analysis/${final.analysisId}`);
        return;
      }
      final = applyEvent(final, { type: "transportError", message: rpcErrorMessage(e) });
    }

    const outcome = outcomeOf(final);
    if (outcome.kind === "open") {
      router.push(outcome.url);
      return;
    }
    setError({ message: outcome.message, analysisId: outcome.analysisId });
    setPhase("error");
  }

  return { phase, progress, error, analyze };
}
