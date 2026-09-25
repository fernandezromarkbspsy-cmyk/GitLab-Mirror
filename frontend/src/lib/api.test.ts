import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { supabase } from "./supabase";

describe("api request helper", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds JSON headers only when sending a JSON request body", async () => {
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: { session: { access_token: "token-123" } },
      error: null,
    } as any);

    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    await api("/users", {
      method: "POST",
      body: JSON.stringify({ name: "Ops PIC" }),
    });

    const postRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const postHeaders = new Headers(postRequest.headers);
    expect(postHeaders.get("Content-Type")).toBe("application/json");

    await api("/health", { method: "GET" });

    const getRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const getHeaders = new Headers(getRequest.headers);
    expect(getHeaders.has("Content-Type")).toBe(false);
  });
});
