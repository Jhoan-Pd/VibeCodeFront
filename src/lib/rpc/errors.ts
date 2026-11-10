import { Code, ConnectError } from "@connectrpc/connect";
import { messages } from "@/i18n";

/**
 * Turns any failed RPC into a message to show. The backend already sends safe Spanish messages for
 * every error it produces; this only covers what the backend never got to answer: no network, the free
 * Render instance waking up (a plain 502/503 from its proxy), timeouts and cancellations.
 */
export function rpcErrorMessage(error: unknown): string {
  const e = ConnectError.from(error);
  switch (e.code) {
    case Code.Canceled:
      return "";
    case Code.DeadlineExceeded:
      return messages.errors.timeout;
    case Code.Unknown:
      return e.cause instanceof TypeError ? messages.errors.noConnection : messages.errors.unexpected;
    case Code.Unavailable:
    case Code.Internal:
      // "HTTP 502" and friends come from the hosting proxy, not from our backend.
      return /^HTTP \d{3}/.test(e.rawMessage) ? messages.errors.serverWakingUp : e.rawMessage || messages.errors.unexpected;
    default:
      return e.rawMessage || messages.errors.unexpected;
  }
}

export const isNotFound = (error: unknown) => ConnectError.from(error).code === Code.NotFound;
export const isUnauthenticated = (error: unknown) => ConnectError.from(error).code === Code.Unauthenticated;

/** Discriminated result of a browser call: components branch on `ok` instead of try/catch. */
export type RpcResult<T> = { ok: true; data: T } | { ok: false; error: string; code: Code };

export async function attempt<T>(call: () => Promise<T>): Promise<RpcResult<T>> {
  try {
    return { ok: true, data: await call() };
  } catch (error) {
    return { ok: false, error: rpcErrorMessage(error), code: ConnectError.from(error).code };
  }
}
