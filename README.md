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

For staging on `system174.andrewkennedy.dev.com`, set:

- `SOUNDCLOUD_REDIRECT_URI=https://system174.andrewkennedy.dev.com/soundcloud/callback`

Also add the same callback URL in your SoundCloud app settings.

## Hostinger deploy settings

- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm run start`

