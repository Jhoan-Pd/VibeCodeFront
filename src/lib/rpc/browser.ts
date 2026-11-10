"use client";

import { createClient, type Client, type Interceptor } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import type { DescService } from "@bufbuild/protobuf";
import { AnalysisService } from "@/gen/vibedecoder/v1/analysis_pb";
import { ChatService } from "@/gen/vibedecoder/v1/chat_pb";
import { GistService } from "@/gen/vibedecoder/v1/gist_pb";
import { QuizService } from "@/gen/vibedecoder/v1/quiz_pb";
import { ShareService } from "@/gen/vibedecoder/v1/share_pb";
import { UserService } from "@/gen/vibedecoder/v1/user_pb";
import { publicConfig } from "@/config/public";
import { TokenCache } from "./token-cache";

/**
 * Connect clients for Client Components. The browser talks to the backend directly (no proxy through
 * Next), which is what makes server streaming of Analyze possible on Vercel's free plan.
 * Authentication: a 5-minute token from /api/backend-token, cached in memory and renewed before it expires.
 */

const tokens = new TokenCache(async () => {
  const res = await fetch("/api/backend-token", { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as { token: string; expiresAt: number };
});

const auth: Interceptor = (next) => async (req) => {
  const token = await tokens.get();
  if (token) req.header.set("authorization", `Bearer ${token}`);
  return next(req);
};

const transport = createConnectTransport({ baseUrl: publicConfig.backendUrl, interceptors: [auth], useHttpGet: true });

const clients = new Map<string, Client<DescService>>();

function client<S extends DescService>(service: S): Client<S> {
  let c = clients.get(service.typeName);
  if (!c) {
    c = createClient(service, transport) as unknown as Client<DescService>;
    clients.set(service.typeName, c);
  }
  return c as unknown as Client<S>;
}

/** One lazily created client per service, shared by every component. */
export const rpc = {
  get analysis() {
    return client(AnalysisService);
  },
  get quiz() {
    return client(QuizService);
  },
  get chat() {
    return client(ChatService);
  },
  get share() {
    return client(ShareService);
  },
  get user() {
    return client(UserService);
  },
  get gist() {
    return client(GistService);
  },
};

/** Forget the cached token (after signing out). */
export const clearBackendToken = () => tokens.clear();
