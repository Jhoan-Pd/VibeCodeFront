import { describe, expect, it } from "vitest";
import { Code, ConnectError } from "@connectrpc/connect";
import { messages } from "@/i18n";
import { attempt, rpcErrorMessage } from "@/lib/rpc/errors";

describe("rpcErrorMessage", () => {
  it("shows the backend's own message (it is always safe and in Spanish)", () => {
    expect(rpcErrorMessage(new ConnectError("Llegaste al límite de 10 análisis nuevos por día.", Code.ResourceExhausted))).toBe(
      "Llegaste al límite de 10 análisis nuevos por día.",
    );
    expect(rpcErrorMessage(new ConnectError("Análisis no encontrado", Code.NotFound))).toBe("Análisis no encontrado");
  });

  it("a network failure becomes "no connection"", () => {
    const e = new ConnectError("Failed to fetch", Code.Unknown, undefined, undefined, new TypeError("Failed to fetch"));
    expect(rpcErrorMessage(e)).toBe(messages.errors.noConnection);
  });

  it("a bare 502/503 from the hosting proxy means the free backend is waking up", () => {
    expect(rpcErrorMessage(new ConnectError("HTTP 502", Code.Unavailable))).toBe(messages.errors.serverWakingUp);
  });

  it("timeouts and cancellations", () => {
    expect(rpcErrorMessage(new ConnectError("deadline", Code.DeadlineExceeded))).toBe(messages.errors.timeout);
    expect(rpcErrorMessage(new ConnectError("aborted", Code.Canceled))).toBe("");
  });

  it("anything else gets the generic message", () => {
    expect(rpcErrorMessage("boom")).toBe(messages.errors.unexpected);
  });
});

describe("attempt", () => {
  it("wraps success and failure in a discriminated result", async () => {
    expect(await attempt(async () => 42)).toEqual({ ok: true, data: 42 });
    expect(await attempt(async () => Promise.reject(new ConnectError("Sin cupo", Code.ResourceExhausted)))).toEqual({
      ok: false,
      error: "Sin cupo",
      code: Code.ResourceExhausted,
    });
  });
});
