export interface Note {
  _id: string;
  _rev: string;
  text: string;
  done: boolean;
  createdAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  if (res.status === 204) return undefined as T;
  // Error replies may not be JSON, e.g. the dev proxy's 502 when the API is down.
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body as T;
}

const notePath = (id: string) => `/api/notes/${encodeURIComponent(id)}`;

export const api = {
  list: () => request<Note[]>("/api/notes"),
  create: (text: string) =>
    request<Note>("/api/notes", { method: "POST", body: JSON.stringify({ text }) }),
  update: (id: string, patch: Partial<Pick<Note, "text" | "done">>) =>
    request<Note>(notePath(id), { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: string) => request<void>(notePath(id), { method: "DELETE" }),
};
