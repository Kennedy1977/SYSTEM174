# SYSTEM174

A Next.js app-router site for `system174.co.uk`, including SoundCloud-powered music pages, consent-managed analytics, and a protected admin dashboard.

## Local development

```sh
npm install
npm run dev
```

The local app runs at `http://localhost:3000`.

## Production build and run

```sh
npm run build
npm run start
```

Production builds use `next build --webpack` for deployment stability, and the Express wrapper will trigger the same build automatically on startup if `.next/BUILD_ID` is missing.

## Environment variables

Copy `.env.example` to `.env` and fill in real values.

Required:

- `SITE_URL`
- `SOUNDCLOUD_CLIENT_ID`
- `SOUNDCLOUD_CLIENT_SECRET`
- `SOUNDCLOUD_REDIRECT_URI`
- `SOUNDCLOUD_ACCESS_TOKEN`
- `SOUNDCLOUD_REFRESH_TOKEN`

Optional:

- `SITE_VARIANT`
- `SOUNDCLOUD_TOKENS_PATH`
- `SOUNDCLOUD_CATALOG_OVERRIDES_PATH`
- `SOUNDCLOUD_PAGINATION`
- `ADMIN_DASHBOARD_PASSWORD`
- `SOUNDCLOUD_TOKEN_EXPORT_KEY`

The app now refreshes SoundCloud tokens automatically and writes the latest access and refresh token pair to `.soundcloud.tokens.json` by default. On restart it will read that cache back in, so you do not need to manually re-authenticate after every token refresh.

If your host clears the application filesystem on restart or deploy, point `SOUNDCLOUD_TOKENS_PATH` at a persistent writable location. If the host does not offer persistent storage, you will still need to reconnect SoundCloud after the token cache is lost.

Track-to-brand website assignments are stored separately in `.soundcloud.catalog-overrides.json` by default. If your host clears the application filesystem on deploy or restart, point `SOUNDCLOUD_CATALOG_OVERRIDES_PATH` at persistent writable storage too.

`SOUNDCLOUD_PAGINATION` controls how the `music` and `playlists` pages load items:

- `off` (default): lazy continuous scroll
- `on`: numbered previous/next pagination

For `system174.co.uk`, set:

- `SITE_VARIANT=system174`
- `SITE_URL=https://system174.co.uk`
- `SOUNDCLOUD_REDIRECT_URI=https://system174.co.uk/soundcloud/callback`

Also add the same callback URL in your SoundCloud app settings.

For `pimpsoul.co.uk`, set:

- `SITE_VARIANT=pimpsoul`
- `SITE_URL=https://pimpsoul.co.uk`

The `pimpsoul` variant switches the heading typeface to `DraftWerk Bold` while leaving the body copy unchanged.

Do not leave `SITE_URL` blank on the server. If you do not want to set it, remove the variable entirely and the app will fall back to the correct domain for the selected `SITE_VARIANT`.

## Admin dashboard

The protected admin area lives at `/admin/dashboard`.

Set `ADMIN_DASHBOARD_PASSWORD` on the server to enable it.

If `ADMIN_DASHBOARD_PASSWORD` is not set, the dashboard falls back to `SOUNDCLOUD_TOKEN_EXPORT_KEY` for access, which preserves compatibility with the older temporary admin flow.

Inside the admin dashboard you can:

- check live SoundCloud connection health
- refresh the cached SoundCloud catalog manually
- review the full track list and assign tracks to `SYSTEM 174`, `The Pimpsoul Project`, `Andy K / Archive`, or `Hidden`
- download a JSON backup of track assignments, import a backup after redeploy, and restore the latest browser-stored backup
- export the current SoundCloud token pair from `/admin/dashboard/tokens`

If your host clears the application filesystem on deploy, the dashboard will now show the override storage path and lets you export/import assignment backups. For best durability, keep `SOUNDCLOUD_CATALOG_OVERRIDES_PATH` on persistent storage and download a backup before redeploying.

## Hostinger deploy settings

- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm run start`
- Node.js version: `22.x`

This repo uses `next@16`, which requires Node.js `20.9+`. Hostinger supports `18.x`, `20.x`, `22.x`, and `24.x`, and auto-detects the version from your project settings. If the deploy still shows `503`, manually force the app to `22.x` in the Hostinger deployment settings and redeploy.

The production runtime now starts through [server.js](/Users/andrew/Development/SYSTEM174/server.js), which wraps the Next app in an Express server. If the host starts the app before building `.next`, the wrapper will run the production build itself and then boot the server. A simple health endpoint is available at `/healthz`.

## Artwork workflow

Convert source artwork to release-ready WebP files:

```sh
npm run artwork -- ./path/to/source-image.png chasing-shadows
```

Output files are written to `public/artwork/releases`:

- `chasing-shadows-sm.webp` (480x480)
- `chasing-shadows-md.webp` (960x960)
- `chasing-shadows-lg.webp` (1280x1280)
