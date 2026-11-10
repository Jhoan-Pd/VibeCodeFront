import "server-only";
import { cache } from "react";
import { AnalysisService } from "@/gen/vibedecoder/v1/analysis_pb";
import { ChatService } from "@/gen/vibedecoder/v1/chat_pb";
import { ProgressService } from "@/gen/vibedecoder/v1/progress_pb";
import { ShareService } from "@/gen/vibedecoder/v1/share_pb";
import { UserService } from "@/gen/vibedecoder/v1/user_pb";
import type { AnalysisDetail } from "@/types/analysis-view";
import { isNotFound } from "./errors";
import { fromProtoAnalysis, fromProtoChatMessage, fromProtoListItem, fromProtoProgress, fromProtoQuota, fromProtoUser } from "./mappers";
import { publicClient, userClient } from "./server";

/**
 * Data reads used by Server Components, already mapped to view models. Each one is wrapped in React's
 * `cache`, so a page and its generateMetadata (or two components) share one backend call per request.
 */

/** The analysis, or null when it does not exist or belongs to someone else (the backend says NOT_FOUND). */
export const getAnalysis = cache(async (analysisId: string): Promise<AnalysisDetail | null> => {
  try {
    const { analysis } = await (await userClient(AnalysisService)).getAnalysis({ analysisId });
    return analysis ? fromProtoAnalysis(analysis) : null;
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
});

/** Stored chat of an analysis; empty when the analysis is not found (the page then shows its 404). */
export const listChatMessages = cache(async (analysisId: string) => {
  try {
    const { messages } = await (await userClient(ChatService)).listMessages({ analysisId });
    return messages.map(fromProtoChatMessage);
  } catch (e) {
    if (isNotFound(e)) return [];
    throw e;
  }
});

export const listAnalyses = cache(async () => {
  const { analyses } = await (await userClient(AnalysisService)).listAnalyses({ pageSize: 100 });
  return analyses.map(fromProtoListItem);
});

export const getQuota = cache(async () => {
  const q = await (await userClient(AnalysisService)).getQuota({});
  return { analyses: fromProtoQuota(q.analyses), aiQueries: fromProtoQuota(q.aiQueries) };
});

export const getProgress = cache(async () => fromProtoProgress(await (await userClient(ProgressService)).getProgress({})));

export const getProfile = cache(async () => {
  const { user } = await (await userClient(UserService)).getProfile({});
  return user ? fromProtoUser(user) : null;
});

/** Seconds a public link is served from cache before it is regenerated (ISR). */
export const SHARED_REVALIDATE_SECONDS = 60;

/** A shared analysis by its public token, or null when the link does not exist or was revoked. */
export const getSharedAnalysis = cache(async (token: string): Promise<AnalysisDetail | null> => {
  try {
    const { analysis } = await publicClient(ShareService, SHARED_REVALIDATE_SECONDS).getSharedAnalysis({ token });
    return analysis ? fromProtoAnalysis(analysis) : null;
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
});
