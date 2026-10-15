import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api", () => {
  it("returns the parsed body on success", async () => {
    mockFetch(Response.json([{ _id: "1", text: "a" }]));
    await expect(api.list()).resolves.toEqual([{ _id: "1", text: "a" }]);
  });

  it("throws the API's error message", async () => {
    mockFetch(Response.json({ error: "text is required" }, { status: 400 }));
    await expect(api.create("")).rejects.toThrow("text is required");
  });

  it("throws the HTTP status when the error body is not JSON", async () => {
    // e.g. the Vite proxy's reply when the API server is down.
    mockFetch(new Response("Bad Gateway", { status: 502 }));
    await expect(api.list()).rejects.toThrow("HTTP 502");
  });

  it("encodes the note id in the URL", async () => {
    const fetchMock = mockFetch(new Response(null, { status: 204 }));
    await api.remove("a/b?c");
    expect(fetchMock).toHaveBeenCalledWith("/api/notes/a%2Fb%3Fc", expect.objectContaining({ method: "DELETE" }));
  });
});
