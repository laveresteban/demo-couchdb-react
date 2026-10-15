import { useEffect, useState, type FormEvent } from "react";
import { api, type Note } from "./api";

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Run an API call, show any failure, and keep the list in sync with the server.
  async function run(action: () => Promise<void>) {
    try {
      setError(null);
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    run(async () => setNotes(await api.list()));
  }, []);

  function add(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    run(async () => {
      const note = await api.create(text);
      setNotes((prev) => [...prev, note]);
      setText("");
    });
  }

  function toggle(note: Note) {
    run(async () => {
      const updated = await api.update(note._id, { done: !note.done });
      setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
    });
  }

  function remove(note: Note) {
    run(async () => {
      await api.remove(note._id);
      setNotes((prev) => prev.filter((n) => n._id !== note._id));
    });
  }

  return (
    <main className="app">
      <h1>Notes</h1>
      <p className="subtitle">Stored in CouchDB, served by an Express API using couchdb-node.</p>

      <form onSubmit={add} className="add">
        <input
          aria-label="New note"
          placeholder="What needs doing?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {error && <p role="alert" className="error">{error}</p>}

      <ul className="notes">
        {notes.map((note) => (
          <li key={note._id} className={note.done ? "done" : undefined}>
            <label>
              <input type="checkbox" checked={note.done} onChange={() => toggle(note)} />
              <span>{note.text}</span>
            </label>
            <button className="delete" aria-label={`Delete ${note.text}`} onClick={() => remove(note)}>
              ×
            </button>
          </li>
        ))}
      </ul>

      {notes.length === 0 && !error && <p className="empty">No notes yet.</p>}
    </main>
  );
}
