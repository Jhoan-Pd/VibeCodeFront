import "server-only";
import { createClient, type Client, type Interceptor } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import type { DescService } from "@bufbuild/protobuf";
import { cache } from "react";
import { auth } from "@/auth";
import { serverEnv } from "@/config/env";
import { signServiceToken, signUserToken } from "./tokens";

/**
 * Connect clients for Server Components, Route Handlers and Auth.js callbacks.
 *
 * The transport is the same Connect protocol the browser uses (JSON over fetch), so Next's fetch cache
 * applies: public reads pass `revalidate` and become ISR-friendly, private reads are `no-store`.
 */

type Caching = { revalidate: number } | "no-store";

function bearer(getToken: () => Promise<string>): Interceptor {
  return (next) => async (req) => {
    req.header.set("authorization", `Bearer ${await getToken()}`);
    return next(req);
  };
}

function transport(interceptors: Interceptor[], caching: Caching, useHttpGet = false) {
  return createConnectTransport({
    baseUrl: serverEnv.backendUrl,
    useHttpGet,
    interceptors,
    fetch: (input, init) => fetch(input, caching === "no-store" ? { ...init, cache: "no-store" } : { ...init, next: { revalidate: caching.revalidate } }),
  });
}

/** Thrown when a page needs the user but there is no session (the middleware normally redirects first). */
export class NoSessionError extends Error {
  constructor() {
    super("No session");
    this.name = "NoSessionError";
  }
}

/** Id of the signed-in user, or null. Cached per request: auth() runs once even if many components ask. */
export const currentUserId = cache(async (): Promise<string | null> => (await auth())?.user?.id ?? null);

/** Client that acts as the signed-in user. Never cached: the data is private. */
export async function userClient<S extends DescService>(service: S): Promise<Client<S>> {
  const userId = await currentUserId();
  if (!userId) throw new NoSessionError();
  return createClient(service, transport([bearer(async () => (await signUserToken(userId)).token)], "no-store", true));
}

/** Client that acts as the frontend itself (service scope). */
export function serviceClient<S extends DescService>(service: S): Client<S> {
  return createClient(service, transport([bearer(async () => (await signServiceToken()).token)], "no-store"));
}

/**
 * Anonymous client for public RPCs. Reads use HTTP GET (they are NO_SIDE_EFFECTS in the contract), so
 * Next's data cache can keep them for `revalidateSeconds` — the basis of ISR for public links.
 */
export function publicClient<S extends DescService>(service: S, revalidateSeconds?: number): Client<S> {
  return createClient(service, transport([], revalidateSeconds ? { revalidate: revalidateSeconds } : "no-store", revalidateSeconds !== undefined));
}
