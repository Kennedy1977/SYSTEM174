import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SC_API_BASE = "https://api.soundcloud.com";
const SC_OAUTH_BASE = "https://secure.soundcloud.com";
const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

function getEnvValue(key: string) {
  return process.env[key] ?? metaEnv[key] ?? "";
}

function getAuthEnv() {
  return {
    clientId: getEnvValue("SOUNDCLOUD_CLIENT_ID"),
    clientSecret: getEnvValue("SOUNDCLOUD_CLIENT_SECRET"),
    redirectUri: getEnvValue("SOUNDCLOUD_REDIRECT_URI"),
  };
}

function getTokensPath() {
  return path.resolve(process.cwd(), getEnvValue("SOUNDCLOUD_TOKENS_PATH") || ".soundcloud.tokens.json");
}

type TokenState = {
  accessToken: string;
  refreshToken: string;
};

const tokenState: TokenState = {
  accessToken: getEnvValue("SOUNDCLOUD_ACCESS_TOKEN"),
  refreshToken: getEnvValue("SOUNDCLOUD_REFRESH_TOKEN"),
};

type PersistedTokenState = Partial<{
  SOUNDCLOUD_ACCESS_TOKEN: string;
  SOUNDCLOUD_REFRESH_TOKEN: string;
  accessToken: string;
  refreshToken: string;
}>;

let tokenBootstrapPromise: Promise<void> | null = null;
let tokenRefreshPromise: Promise<void> | null = null;

export type SoundCloudTrack = {
  id: number;
  title: string;
  genre?: string | null;
  sharing?: string | null;
  access?: string | null;
  playback_count?: number | null;
  favoritings_count?: number | null;
  artwork_url: string | null;
  permalink_url: string;
  created_at: string;
};

export type SoundCloudPlaylist = {
  id: number;
  title: string;
  genre?: string | null;
  artwork_url: string | null;
  permalink_url: string;
  created_at: string;
  tracks?: Array<{
    id: number;
    title?: string;
    sharing?: string | null;
    access?: string | null;
  }>;
};

export type SoundCloudMe = {
  id: number;
  username: string;
  avatar_url: string | null;
  permalink_url: string;
};

export type SoundCloudDashboardData = {
  me: SoundCloudMe | null;
  tracks: SoundCloudTrack[];
  playlists: SoundCloudPlaylist[];
};

type OAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getOptionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function getRequiredNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0;
}

function hasSecretToken(url: string) {
  return url.includes("secret_token=") || /\/s-[A-Za-z0-9]+/.test(url);
}

function getHighResArtworkUrl(url: string | null) {
  if (!url) {
    return null;
  }

  const [pathname, search = ""] = url.split("?");
  const upgradedPathname = pathname.replace(
    /-(?:tiny|small|badge|t67x67|large|t300x300|crop|t500x500|original)\.(jpg|jpeg|png|webp)$/i,
    "-t500x500.$1",
  );

  if (!search) {
    return upgradedPathname;
  }

  return `${upgradedPathname}?${search}`;
}

function isPublicSoundCloudItem(value: unknown) {
  const item = asObject(value);
  if (!item) {
    return false;
  }

  const sharing = getString(item.sharing).toLowerCase();
  if (sharing === "private") {
    return false;
  }

  const access = getString(item.access)
    .toLowerCase()
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (access.includes("blocked") || access.includes("private")) {
    return false;
  }

  const secretUri = getString(item.secret_uri);
  if (secretUri) {
    return false;
  }

  const permalinkUrl = getString(item.permalink_url);
  if (permalinkUrl && hasSecretToken(permalinkUrl)) {
    return false;
  }

  return true;
}

function sanitizeMe(value: unknown): SoundCloudMe | null {
  const me = asObject(value);
  if (!me) {
    return null;
  }

  return {
    id: getRequiredNumber(me.id),
    username: getString(me.username),
    avatar_url: getHighResArtworkUrl(getNullableString(me.avatar_url)),
    permalink_url: getString(me.permalink_url),
  };
}

function sanitizeTrack(value: unknown): SoundCloudTrack | null {
  const track = asObject(value);
  if (!track || !isPublicSoundCloudItem(track)) {
    return null;
  }

  return {
    id: getRequiredNumber(track.id),
    title: getString(track.title),
    genre: getNullableString(track.genre),
    sharing: getNullableString(track.sharing),
    access: getNullableString(track.access),
    playback_count: getOptionalNumber(track.playback_count),
    favoritings_count: getOptionalNumber(track.favoritings_count),
    artwork_url: getHighResArtworkUrl(getNullableString(track.artwork_url)),
    permalink_url: getString(track.permalink_url),
    created_at: getString(track.created_at),
  };
}

function sanitizePlaylistTrack(value: unknown) {
  const track = asObject(value);
  if (!track || !isPublicSoundCloudItem(track)) {
    return null;
  }

  return {
    id: getRequiredNumber(track.id),
    title: getString(track.title) || undefined,
    sharing: getNullableString(track.sharing),
    access: getNullableString(track.access),
  };
}

function sanitizePlaylist(value: unknown): SoundCloudPlaylist | null {
  const playlist = asObject(value);
  if (!playlist || !isPublicSoundCloudItem(playlist)) {
    return null;
  }

  const tracks = Array.isArray(playlist.tracks)
    ? playlist.tracks.map((track) => sanitizePlaylistTrack(track)).filter(Boolean)
    : undefined;

  return {
    id: getRequiredNumber(playlist.id),
    title: getString(playlist.title),
    genre: getNullableString(playlist.genre),
    artwork_url: getHighResArtworkUrl(getNullableString(playlist.artwork_url)),
    permalink_url: getString(playlist.permalink_url),
    created_at: getString(playlist.created_at),
    tracks,
  };
}

function hasOAuthClientConfig() {
  const { clientId, clientSecret, redirectUri } = getAuthEnv();
  return Boolean(clientId && clientSecret && redirectUri);
}

function hasAccessToken() {
  return Boolean(tokenState.accessToken);
}

export function getSoundCloudAuthConfig() {
  const { clientId, clientSecret, redirectUri } = getAuthEnv();
  return {
    clientId,
    clientSecret,
    redirectUri,
    hasClientConfig: hasOAuthClientConfig(),
    hasAccessToken: hasAccessToken(),
  };
}

async function writeDevTokensFile() {
  const payload = {
    SOUNDCLOUD_ACCESS_TOKEN: tokenState.accessToken,
    SOUNDCLOUD_REFRESH_TOKEN: tokenState.refreshToken,
    generated_at: new Date().toISOString(),
  };

  try {
    const tokensPath = getTokensPath();
    await mkdir(path.dirname(tokensPath), { recursive: true });
    await writeFile(tokensPath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (error) {
    console.warn("[soundcloud] unable to write token cache", error);
  }
}

async function loadPersistedTokens() {
  if (tokenBootstrapPromise) {
    await tokenBootstrapPromise;
    return;
  }

  tokenBootstrapPromise = (async () => {
    try {
      const raw = await readFile(getTokensPath(), "utf-8");
      const parsed = JSON.parse(raw) as PersistedTokenState;
      const accessToken = parsed.SOUNDCLOUD_ACCESS_TOKEN ?? parsed.accessToken ?? "";
      const refreshToken = parsed.SOUNDCLOUD_REFRESH_TOKEN ?? parsed.refreshToken ?? "";

      if (accessToken) {
        tokenState.accessToken = accessToken;
      }

      if (refreshToken) {
        tokenState.refreshToken = refreshToken;
      }
    } catch (error) {
      if ((error as { code?: string }).code !== "ENOENT") {
        console.warn("[soundcloud] unable to read token cache", error);
      }
    }
  })();

  await tokenBootstrapPromise;
}

export async function exchangeCodeForTokens(code: string, codeVerifier?: string) {
  const { clientId, clientSecret, redirectUri } = getAuthEnv();
  if (!hasOAuthClientConfig()) {
    throw new Error("Missing SoundCloud OAuth client configuration");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code,
  });
  if (codeVerifier) {
    body.set("code_verifier", codeVerifier);
  }

  const response = await fetch(`${SC_OAUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SoundCloud code exchange failed (${response.status}): ${detail}`);
  }

  const json = (await response.json()) as OAuthTokenResponse;
  tokenState.accessToken = json.access_token;
  tokenState.refreshToken = json.refresh_token ?? tokenState.refreshToken;

  await writeDevTokensFile();
  console.info("[soundcloud] received OAuth tokens and updated the token cache");
}

export async function refreshAccessToken() {
  await loadPersistedTokens();

  if (tokenRefreshPromise) {
    await tokenRefreshPromise;
    return;
  }

  tokenRefreshPromise = (async () => {
    const { clientId, clientSecret } = getAuthEnv();
    if (!hasOAuthClientConfig()) {
      throw new Error("Missing SoundCloud OAuth client configuration");
    }

    if (!tokenState.refreshToken) {
      throw new Error("Missing SoundCloud refresh token");
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: tokenState.refreshToken,
    });

    const response = await fetch(`${SC_OAUTH_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`SoundCloud token refresh failed (${response.status}): ${detail}`);
    }

    const json = (await response.json()) as OAuthTokenResponse;
    tokenState.accessToken = json.access_token;
    tokenState.refreshToken = json.refresh_token ?? tokenState.refreshToken;

    await writeDevTokensFile();
  })();

  try {
    await tokenRefreshPromise;
  } finally {
    tokenRefreshPromise = null;
  }
}

export async function scRequest(pathname: string, init?: RequestInit) {
  await loadPersistedTokens();

  if (!hasAccessToken()) {
    await refreshAccessToken();
  }

  const makeRequest = async () => {
    return fetch(`${SC_API_BASE}${pathname}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `OAuth ${tokenState.accessToken}`,
      },
    });
  };

  let response = await makeRequest();
  if (response.status === 401) {
    await refreshAccessToken();
    response = await makeRequest();
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SoundCloud request failed (${response.status}) for ${pathname}: ${detail}`);
  }

  return response;
}

export async function getMe() {
  const response = await scRequest("/me");
  return sanitizeMe(await response.json());
}

export async function getMyTracks(limit = 12) {
  const response = await scRequest(`/me/tracks?limit=${limit}&linked_partitioning=1`);
  const json = (await response.json()) as { collection?: unknown[] } | unknown[];
  const collection = Array.isArray(json) ? json : json.collection ?? [];
  return collection.map((track) => sanitizeTrack(track)).filter(Boolean);
}

export async function getMyPlaylists(limit = 12) {
  const response = await scRequest(`/me/playlists?limit=${limit}&linked_partitioning=1`);
  const json = (await response.json()) as { collection?: unknown[] } | unknown[];
  const collection = Array.isArray(json) ? json : json.collection ?? [];
  return collection.map((playlist) => sanitizePlaylist(playlist)).filter(Boolean);
}

export async function getSoundCloudDashboardData(): Promise<SoundCloudDashboardData> {
  await loadPersistedTokens();

  if (!hasOAuthClientConfig() || (!tokenState.accessToken && !tokenState.refreshToken)) {
    return {
      me: null,
      tracks: [],
      playlists: [],
    };
  }

  try {
    const [me, tracks, playlists] = await Promise.all([getMe(), getMyTracks(100), getMyPlaylists(100)]);
    return { me, tracks, playlists };
  } catch (error) {
    console.warn("[soundcloud] unable to fetch dashboard data", error);
    return {
      me: null,
      tracks: [],
      playlists: [],
    };
  }
}
