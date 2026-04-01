# SYSTEM174 API

Document-backed API service for `system174.co.uk` and `pimpsoul.co.uk`.

## What this scaffold includes

- Fastify-based API runtime
- Persistent JSON document storage
- Public content and catalog endpoints
- Protected admin endpoints via `x-admin-key` or `Authorization: Bearer`
- Seed content documents for `system174` and `pimpsoul`
- Placeholder SoundCloud integration state
- SoundCloud OAuth callback, token persistence, and catalog sync

## Local development

```sh
npm install
npm run dev
```

The API defaults to `http://localhost:4100`.

## Production

```sh
npm install
npm run build
npm run start
```

## Environment variables

Copy `.env.example` to `.env`.

- `API_HOST`
- `API_PORT`
- `API_BASE_URL`
- `DATA_DIR`
- `ADMIN_API_KEY`
- `ALLOWED_ORIGINS`
- `SOUNDCLOUD_CLIENT_ID`
- `SOUNDCLOUD_CLIENT_SECRET`
- `SOUNDCLOUD_REDIRECT_URI`
- `SOUNDCLOUD_ACCESS_TOKEN`
- `SOUNDCLOUD_REFRESH_TOKEN`

## Data directory

Keep `DATA_DIR` on persistent storage. This API reads and writes JSON documents there.

Current document groups:

- `sites`
- `catalog`
- `integrations`
- `sync`

## SoundCloud admin flow

- Start OAuth: `GET /v1/admin/soundcloud/login`
- Callback: `GET /v1/admin/soundcloud/callback`
- Status: `GET /v1/admin/soundcloud/status`
- Sync catalog: `POST /v1/admin/soundcloud/sync`

Protected admin routes require either:

- `x-admin-key: <ADMIN_API_KEY>`
- `Authorization: Bearer <ADMIN_API_KEY>`

The callback route stores refreshed tokens into the document store so the API can keep working after deploys.
