import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { api, type Note } from "./api";

vi.mock("./api", () => ({
  api: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const note = (id: string, text: string, done = false): Note => ({
  _id: id,
  _rev: "1-x",
  text,
  done,
  createdAt: "2026-01-01T00:00:00.000Z",
});

beforeEach(() => {
  vi.mocked(api.list).mockResolvedValue([note("1", "buy milk")]);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("App", () => {
  it("lists notes from the API", async () => {
    render(<App />);
    expect(await screen.findByText("buy milk")).toBeTruthy();
  });

  it("shows an empty state", async () => {
    vi.mocked(api.list).mockResolvedValue([]);
    render(<App />);
    expect(await screen.findByText("No notes yet.")).toBeTruthy();
  });

  it("adds a note and clears the input", async () => {
    vi.mocked(api.create).mockResolvedValue(note("2", "walk dog"));
    render(<App />);
    const input = screen.getByLabelText<HTMLInputElement>("New note");
    await userEvent.type(input, "walk dog{Enter}");
    expect(await screen.findByText("walk dog")).toBeTruthy();
    expect(api.create).toHaveBeenCalledWith("walk dog");
    expect(input.value).toBe("");
  });

  it("does not submit a blank note", async () => {
    render(<App />);
    await userEvent.type(screen.getByLabelText("New note"), "   {Enter}");
    expect(api.create).not.toHaveBeenCalled();
  });

  it("toggles a note", async () => {
    vi.mocked(api.update).mockResolvedValue(note("1", "buy milk", true));
    render(<App />);
    await userEvent.click(await screen.findByRole("checkbox"));
    expect(api.update).toHaveBeenCalledWith("1", { done: true });
    expect((await screen.findByRole<HTMLInputElement>("checkbox")).checked).toBe(true);
  });

  it("deletes a note", async () => {
    vi.mocked(api.remove).mockResolvedValue(undefined);
    render(<App />);
    await userEvent.click(await screen.findByLabelText("Delete buy milk"));
    expect(api.remove).toHaveBeenCalledWith("1");
    expect(await screen.findByText("No notes yet.")).toBeTruthy();
  });

  it("shows API errors", async () => {
    vi.mocked(api.list).mockRejectedValue(new Error("HTTP 502"));
    render(<App />);
    expect((await screen.findByRole("alert")).textContent).toBe("HTTP 502");
  });
});
