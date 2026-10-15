import express, { type NextFunction, type Request, type Response } from "express";
import { NotFound, type Database } from "couchdb-node";

interface Note {
  text: string;
  done: boolean;
  createdAt: string;
}

type NotePatch = Partial<Pick<Note, "text" | "done">>;

/** Builds the REST API for notes on top of one CouchDB database. */
export function createApp(db: Database) {
  const app = express();
  app.use(express.json());

  app.get("/api/notes", async (_req, res) => {
    const rows = await db.allDocs({ includeDocs: true });
    const notes = rows
      .filter((r) => !r.id.startsWith("_design/"))
      .map((r) => r.doc as Note)
      // _ids are random UUIDs, so allDocs order is arbitrary. Show oldest first.
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    res.json(notes);
  });

  app.post("/api/notes", async (req, res) => {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) {
      res.status(400).json({ error: "text is required" });
      return;
    }
    const note = await db.save({ text, done: false, createdAt: new Date().toISOString() });
    res.status(201).json(note);
  });

  app.patch("/api/notes/:id", async (req, res) => {
    const patch: NotePatch = {};
    if (typeof req.body?.text === "string") patch.text = req.body.text.trim();
    if (typeof req.body?.done === "boolean") patch.done = req.body.done;
    if (patch.text === "") {
      res.status(400).json({ error: "text cannot be empty" });
      return;
    }
    const note = await db.update(req.params.id, (doc) => ({ ...doc, ...patch }));
    res.json(note);
  });

  app.delete("/api/notes/:id", async (req, res) => {
    await db.remove(req.params.id);
    res.status(204).end();
  });

  // Express 5 forwards rejected promises here. Map CouchDB "not found" to 404.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof NotFound) {
      res.status(404).json({ error: "note not found" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "internal error" });
  });

  return app;
}
