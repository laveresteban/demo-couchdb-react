import { CouchDB } from "couchdb-node";
import { createApp } from "./app";

const url = process.env.COUCHDB_URL ?? "http://localhost:5984";
const user = process.env.COUCHDB_USER ?? "admin";
const password = process.env.COUCHDB_PASSWORD ?? "password";
const port = Number(process.env.PORT ?? 3001);
const dbName = process.env.COUCHDB_DB ?? "demo_notes";

async function main() {
  const couch = new CouchDB(url, user, password);
  const db = couch.database(dbName);
  // createDatabase throws PreconditionFailed if the database already exists.
  if (!(await db.exists())) await couch.createDatabase(dbName);

  createApp(db).listen(port, () => {
    console.log(`API on http://localhost:${port} (db: ${dbName}, couch: ${url})`);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
