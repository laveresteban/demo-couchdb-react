# demo-couchdb-react

[![ci](https://github.com/laveresteban/demo-couchdb-react/actions/workflows/ci.yml/badge.svg)](https://github.com/laveresteban/demo-couchdb-react/actions/workflows/ci.yml)

A small notes app that shows how to use [couchdb-node](https://github.com/laveresteban/couchdb-node),
a TypeScript SDK for Apache CouchDB, behind a React UI.

```
React (Vite)  ──/api──▶  Express API  ──couchdb-node──▶  CouchDB
   web/                    server/
```

The SDK runs on the server only. The browser talks to the Express API and never
sees CouchDB credentials.

## Prerequisites

- Node.js 20 or newer (CI uses 22, see `.nvmrc`)
- Docker, or any CouchDB 3.x you can reach

## Getting started

### 1. Clone this repo and the SDK side by side

couchdb-node isn't on npm yet, so `server/package.json` links it from
`../../couchdb-node`. Both checkouts must share a parent folder:

```sh
git clone https://github.com/laveresteban/couchdb-node.git
git clone https://github.com/laveresteban/demo-couchdb-react.git

cd couchdb-node && npm ci && npm run build && cd ..
```

### 2. Start CouchDB

```sh
docker run -d --name demo-couchdb \
  -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password \
  -p 5984:5984 couchdb:3.5.2
```

### 3. Run the API and the UI

In two terminals:

```sh
cd demo-couchdb-react/server
npm ci
npm run dev          # API on http://localhost:3001
```

```sh
cd demo-couchdb-react/web
npm ci
npm run dev          # UI on http://localhost:5173
```

Open http://localhost:5173. In dev, Vite forwards `/api` to the API on port 3001.

## Configuration

The server reads these environment variables:

| Variable           | Default                 |
| ------------------ | ----------------------- |
| `COUCHDB_URL`      | `http://localhost:5984` |
| `COUCHDB_USER`     | `admin`                 |
| `COUCHDB_PASSWORD` | `password`              |
| `COUCHDB_DB`       | `demo_notes`            |
| `PORT`             | `3001`                  |

The defaults are for local development only. The server creates the database
on startup if it doesn't exist.

## API

| Method   | Path             | Body                                 | Response               |
| -------- | ---------------- | ------------------------------------ | ---------------------- |
| `GET`    | `/api/notes`     |                                      | `200` notes, oldest first |
| `POST`   | `/api/notes`     | `{ "text": string }`                 | `201` the new note     |
| `PATCH`  | `/api/notes/:id` | `{ "text"?: string, "done"?: boolean }` | `200` the updated note |
| `DELETE` | `/api/notes/:id` |                                      | `204`                  |

Errors return `{ "error": string }`: `400` for empty text, `404` for an unknown
id. `PATCH` retries on conflict through the SDK's `db.update`.

## Tests

```sh
cd server && npm test     # API tests against CouchDB, in a throwaway demo_test_* database
cd web && npm test        # UI and client tests (jsdom, API mocked)
```

Server tests need a running CouchDB. They read the same `COUCHDB_*` variables,
for example `COUCHDB_URL=http://localhost:5985 npm test`.

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push to
`main` and on every pull request:

- **server**: checks out couchdb-node `main` next to this repo, builds it, starts
  a CouchDB 3.5.2 service, then runs typecheck and tests.
- **web**: tests, typecheck and production build. The built `dist/` is uploaded
  as a workflow artifact.

## License

[Apache-2.0](LICENSE). Apache CouchDB is a trademark of The Apache Software
Foundation; this project is not affiliated with or endorsed by the ASF.
