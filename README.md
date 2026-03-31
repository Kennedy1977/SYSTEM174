# SYSTEM174

Astro site configured for SSR with an Express runtime so it can be deployed to platforms that support Node.js/Express app detection.

## Local development

```sh
npm install
npm run dev
```

## Production build and run

```sh
npm run build
npm run start
```

## Environment variables

Copy `.env.example` to `.env` and fill in real values.

Required:

- `SOUNDCLOUD_CLIENT_ID`
- `SOUNDCLOUD_CLIENT_SECRET`
- `SOUNDCLOUD_REDIRECT_URI`
- `SOUNDCLOUD_ACCESS_TOKEN`
- `SOUNDCLOUD_REFRESH_TOKEN`

Optional:

- `SOUNDCLOUD_TOKENS_PATH`
- `SOUNDCLOUD_PAGINATION`
- `SOUNDCLOUD_TOKEN_EXPORT_KEY`

The app now refreshes SoundCloud tokens automatically and writes the latest access and refresh token pair to `.soundcloud.tokens.json` by default. On restart it will read that cache back in, so you do not need to manually re-authenticate after every token refresh.

If your host clears the application filesystem on restart or deploy, point `SOUNDCLOUD_TOKENS_PATH` at a persistent writable location. If the host does not offer persistent storage, you will still need to reconnect SoundCloud after the token cache is lost.

`SOUNDCLOUD_PAGINATION` controls how the `music` and `playlists` pages load items:

- `off` (default): lazy continuous scroll
- `on`: numbered previous/next pagination

For `system174.co.uk`, set:

- `SOUNDCLOUD_REDIRECT_URI=https://system174.co.uk/soundcloud/callback`

Also add the same callback URL in your SoundCloud app settings.

If you cannot read `.soundcloud.tokens.json` on the deployed host, you can temporarily set `SOUNDCLOUD_TOKEN_EXPORT_KEY` on the server, visit `/soundcloud/token-export`, enter that key, copy the current tokens into your persistent env, then remove `SOUNDCLOUD_TOKEN_EXPORT_KEY` again.

If you need to diagnose the live SoundCloud connection without exposing the raw tokens, visit `/soundcloud/status` and use the same `SOUNDCLOUD_TOKEN_EXPORT_KEY` to view the current config/token/API health check.

## Hostinger deploy settings

- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm run start`

## Artwork workflow

Convert source artwork to release-ready WebP files:

```sh
npm run artwork -- ./path/to/source-image.png chasing-shadows
```

Output files are written to `public/artwork/releases`:

- `chasing-shadows-sm.webp` (480x480)
- `chasing-shadows-md.webp` (960x960)
- `chasing-shadows-lg.webp` (1280x1280)
