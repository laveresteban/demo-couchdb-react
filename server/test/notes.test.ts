import { CouchDB } from "couchdb-node";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const url = process.env.COUCHDB_URL ?? "http://localhost:5984";
const couch = new CouchDB(url, process.env.COUCHDB_USER ?? "admin", process.env.COUCHDB_PASSWORD ?? "password");
// Throwaway database per run, so tests never touch the demo data.
const name = `demo_test_${Date.now()}`;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  await couch.createDatabase(name);
  app = createApp(couch.database(name));
});

afterAll(async () => {
  await couch.deleteDatabase(name);
});

describe("notes API", () => {
  it("creates a note and lists it", async () => {
    const created = await request(app).post("/api/notes").send({ text: "buy milk" }).expect(201);
    expect(created.body).toMatchObject({ text: "buy milk", done: false });
    expect(created.body._id).toBeTruthy();

    const list = await request(app).get("/api/notes").expect(200);
    expect(list.body.map((n: { _id: string }) => n._id)).toContain(created.body._id);
  });

  it("rejects a note without text", async () => {
    await request(app).post("/api/notes").send({ text: "   " }).expect(400);
    await request(app).post("/api/notes").send({}).expect(400);
  });

  it("updates text and done", async () => {
    const { body: note } = await request(app).post("/api/notes").send({ text: "old" });
    const res = await request(app).patch(`/api/notes/${note._id}`).send({ text: "new", done: true }).expect(200);
    expect(res.body).toMatchObject({ _id: note._id, text: "new", done: true });
  });

  it("deletes a note", async () => {
    const { body: note } = await request(app).post("/api/notes").send({ text: "temp" });
    await request(app).delete(`/api/notes/${note._id}`).expect(204);
    await request(app).delete(`/api/notes/${note._id}`).expect(404);
  });

  it("returns 404 when updating a missing note", async () => {
    await request(app).patch("/api/notes/does-not-exist").send({ done: true }).expect(404);
  });

  it("rejects an update that blanks the text", async () => {
    const { body: note } = await request(app).post("/api/notes").send({ text: "keep me" });
    await request(app).patch(`/api/notes/${note._id}`).send({ text: "   " }).expect(400);
    const list = await request(app).get("/api/notes");
    expect(list.body.find((n: { _id: string }) => n._id === note._id).text).toBe("keep me");
  });

  it("lists notes oldest first, not in _id order", async () => {
    // _id order (a, z) is the opposite of creation order (z, a).
    const db = couch.database(name);
    await db.save({ _id: "a-newer", text: "newer", done: false, createdAt: "2030-01-01T00:00:00.000Z" });
    await db.save({ _id: "z-older", text: "older", done: false, createdAt: "2020-01-01T00:00:00.000Z" });
    const list = await request(app).get("/api/notes").expect(200);
    const ids = list.body.map((n: { _id: string }) => n._id).filter((id: string) => id.endsWith("er"));
    expect(ids).toEqual(["z-older", "a-newer"]);
  });
});
