# AGENTS.md — demo-couchdb-react

Notes app: React (Vite) UI → Express API → CouchDB, using the `couchdb-node` SDK.
Setup, env vars and the API are in README.md.

## Layout

- `server/`: Express 5 API (`src/app.ts` routes, `src/index.ts` startup). Uses
  `couchdb-node` via `file:../../couchdb-node`: a sibling checkout, built
  (`npm run build`) before `npm ci` here. Not on npm yet.
- `web/`: Vite + React + TypeScript. `/api` is proxied to `localhost:3001`.
  Tests mock `./api`, so they need no server.

## Commands

```sh
cd server && npm test && npm run typecheck   # needs CouchDB; throwaway demo_test_* db
cd web && npm test && npm run build          # build also typechecks
```

If port 5984 is taken, map CouchDB elsewhere and point the tests at it:

```sh
docker run -d --name demo-couchdb -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password -p 5985:5984 couchdb:3.5.2
COUCHDB_URL=http://localhost:5985 npm test   # in server/
```

## CI

`.github/workflows/ci.yml` checks out couchdb-node `main` into a sibling folder
to satisfy the `file:` link. So the demo is tested against SDK `main`, whatever
branch a local SDK checkout is on. Once the SDK is on npm, switch the
dependency to a version range, drop the second checkout, and add `/server`
to `.github/dependabot.yml` (Dependabot cannot resolve the `file:` link).

## Decisions

- The SDK runs on the server only. The browser never sees CouchDB credentials,
  and the SDK's browser support (CORS, `getSetCookie`) is not a documented
  feature.
- `GET /api/notes` sorts by `createdAt` in the server: `_id`s are random UUIDs,
  so `allDocs` order is arbitrary. Fine at demo scale. Use a view or an index if
  the list grows.
