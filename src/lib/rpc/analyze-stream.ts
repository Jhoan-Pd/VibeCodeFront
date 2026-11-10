"use client";

import { create } from "@bufbuild/protobuf";
import { AnalyzeRequestSchema } from "@/gen/vibedecoder/v1/analysis_pb";
import type { AnalysisEvent, Level } from "@/types/analysis-view";
import { rpc } from "./browser";
import { fromProtoAnalyzeResponse, toProtoLevel } from "./mappers";

export interface AnalyzeInput {
  code: string;
  /** A language id or "auto". */
  language: string;
  level: Level;
  title?: string;
  force?: boolean;
}

/**
 * Runs the Analyze server stream and hands every event to `onEvent` as it arrives.
 * Throws the ConnectError when the call fails (the caller turns it into a message).
 */
export async function streamAnalysis(input: AnalyzeInput, onEvent: (e: AnalysisEvent) => void, signal?: AbortSignal): Promise<void> {
  const request = create(AnalyzeRequestSchema, {
    code: input.code,
    language: input.language,
    level: toProtoLevel(input.level),
    title: input.title || undefined,
    force: input.force ?? false,
  });
  for await (const message of rpc.analysis.analyze(request, { signal })) {
    const event = fromProtoAnalyzeResponse(message);
    if (event) onEvent(event);
  }
}
