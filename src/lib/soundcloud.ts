import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SC_API_BASE = "https://api.soundcloud.com";
const SC_OAUTH_BASE = "https://secure.soundcloud.com";

function getEnvValue(key: string) {
  return process.env[key] ?? "";
}

function getAuthEnv() {
  return {
    clientId: getEnvValue("SOUNDCLOUD_CLIENT_ID"),
    clientSecret: getEnvValue("SOUNDCLOUD_CLIENT_SECRET"),
    redirectUri: getEnvValue("SOUNDCLOUD_REDIRECT_URI"),
  };
}

function getTokensPath() {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    getEnvValue("SOUNDCLOUD_TOKENS_PATH") || ".soundcloud.tokens.json",
  );
}

type TokenState = {
  accessToken: string;
  refreshToken: string;
};

export type SoundCloudTokenSnapshot = {
  accessToken: string;
  refreshToken: string;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
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

export type SoundCloudConnectionStatus = {
  checkedAt: string;
  status:
    | "ok"
    | "ok_missing_refresh_token"
    | "missing_config"
    | "missing_tokens"
    | "refresh_failed"
    | "api_failed";
  message: string;
  error: string | null;
  hasClientConfig: boolean;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  redirectUri: string;
  me: SoundCloudMe | null;
  trackCount: number;
  playlistCount: number;
};

type OAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
};

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

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
    ? playlist.tracks.map((track) => sanitizePlaylistTrack(track)).filter(isPresent)
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

async function readPersistedTokensFromDisk() {
  try {
    const raw = await readFile(getTokensPath(), "utf-8");
    const parsed = JSON.parse(raw) as PersistedTokenState;
    return {
      accessToken: parsed.SOUNDCLOUD_ACCESS_TOKEN ?? parsed.accessToken ?? "",
      refreshToken: parsed.SOUNDCLOUD_REFRESH_TOKEN ?? parsed.refreshToken ?? "",
    };
  } catch (error) {
    if ((error as { code?: string }).code !== "ENOENT") {
      console.warn("[soundcloud] unable to read token cache", error);
    }

    return null;
  }
}

async function loadPersistedTokens(force = false) {
  if (!force && tokenBootstrapPromise) {
    await tokenBootstrapPromise;
    return;
  }

  tokenBootstrapPromise = (async () => {
    const persisted = await readPersistedTokensFromDisk();

    if (!persisted) {
      return;
    }

    if (persisted.accessToken) {
      tokenState.accessToken = persisted.accessToken;
    }

    if (persisted.refreshToken) {
      tokenState.refreshToken = persisted.refreshToken;
    }
  })();

  await tokenBootstrapPromise;
}

async function requestTokenRefresh(refreshToken: string) {
  const { clientId, clientSecret } = getAuthEnv();

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  return fetch(`${SC_OAUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
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
  await loadPersistedTokens(true);

  if (tokenRefreshPromise) {
    await tokenRefreshPromise;
    return;
  }

  tokenRefreshPromise = (async () => {
    if (!hasOAuthClientConfig()) {
      throw new Error("Missing SoundCloud OAuth client configuration");
    }

    if (!tokenState.refreshToken) {
      throw new Error("Missing SoundCloud refresh token");
    }

    const attemptedRefreshToken = tokenState.refreshToken;
    let response = await requestTokenRefresh(attemptedRefreshToken);

    if (!response.ok) {
      const detail = await response.text();
      const isInvalidGrant = response.status === 400 && detail.includes("invalid_grant");

      if (isInvalidGrant) {
        await loadPersistedTokens(true);

        if (tokenState.refreshToken && tokenState.refreshToken !== attemptedRefreshToken) {
          console.info("[soundcloud] reloaded a newer refresh token from the token cache");
          response = await requestTokenRefresh(tokenState.refreshToken);

          if (!response.ok) {
            const retryDetail = await response.text();
            throw new Error(`SoundCloud token refresh failed (${response.status}) after cache reload: ${retryDetail}`);
          }
        } else {
          throw new Error(`SoundCloud token refresh failed (${response.status}): ${detail}`);
        }
      } else {
        throw new Error(`SoundCloud token refresh failed (${response.status}): ${detail}`);
      }
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

export async function getSoundCloudTokenSnapshot(): Promise<SoundCloudTokenSnapshot> {
  await loadPersistedTokens(true);

  return {
    accessToken: tokenState.accessToken,
    refreshToken: tokenState.refreshToken,
    hasAccessToken: Boolean(tokenState.accessToken),
    hasRefreshToken: Boolean(tokenState.refreshToken),
  };
}

export async function getSoundCloudConnectionStatus(): Promise<SoundCloudConnectionStatus> {
  await loadPersistedTokens(true);

  const authConfig = getSoundCloudAuthConfig();
  const snapshot = await getSoundCloudTokenSnapshot();
  const baseStatus = {
    checkedAt: new Date().toISOString(),
    hasClientConfig: authConfig.hasClientConfig,
    hasAccessToken: snapshot.hasAccessToken,
    hasRefreshToken: snapshot.hasRefreshToken,
    redirectUri: authConfig.redirectUri,
    me: null,
    trackCount: 0,
    playlistCount: 0,
  } as const;

  if (!authConfig.hasClientConfig) {
    return {
      ...baseStatus,
      status: "missing_config",
      message: "SoundCloud OAuth client configuration is missing from the environment.",
      error: null,
    };
  }

  if (!snapshot.hasAccessToken && !snapshot.hasRefreshToken) {
    return {
      ...baseStatus,
      status: "missing_tokens",
      message: "No SoundCloud access or refresh token is available on the server.",
      error: null,
    };
  }

  try {
    const [me, tracks, playlists] = await Promise.all([getMe(), getMyTracks(100), getMyPlaylists(100)]);

    if (!snapshot.hasRefreshToken) {
      return {
        ...baseStatus,
        status: "ok_missing_refresh_token",
        message:
          "SoundCloud requests are working, but no refresh token is stored. The current access token may stop working when it expires.",
        error: null,
        me,
        trackCount: tracks.length,
        playlistCount: playlists.length,
      };
    }

    return {
      ...baseStatus,
      status: "ok",
      message: "SoundCloud configuration, tokens, and API requests are all working.",
      error: null,
      me,
      trackCount: tracks.length,
      playlistCount: playlists.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      message.includes("token refresh failed") || message.includes("Missing SoundCloud refresh token")
        ? "refresh_failed"
        : "api_failed";

    return {
      ...baseStatus,
      status,
      message:
        status === "refresh_failed"
          ? "SoundCloud tokens are present, but refreshing or reusing them failed."
          : "SoundCloud API requests failed even though configuration and tokens appear to exist.",
      error: message,
    };
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
    const currentAccessToken = tokenState.accessToken;
    await loadPersistedTokens(true);

    if (tokenState.accessToken && tokenState.accessToken !== currentAccessToken) {
      response = await makeRequest();
    }
  }

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

type SoundCloudCollectionPage = {
  collection?: unknown[];
  next_href?: string | null;
};

async function scRequestAbsolute(url: string, init?: RequestInit) {
  await loadPersistedTokens();

  const makeRequest = async () =>
    fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `OAuth ${tokenState.accessToken}`,
      },
    });

  let response = await makeRequest();
  if (response.status === 401) {
    const currentAccessToken = tokenState.accessToken;
    await loadPersistedTokens(true);

    if (tokenState.accessToken && tokenState.accessToken !== currentAccessToken) {
      response = await makeRequest();
    }
  }

  if (response.status === 401) {
    await refreshAccessToken();
    response = await makeRequest();
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SoundCloud request failed (${response.status}) for ${url}: ${detail}`);
  }

  return response;
}

async function getPaginatedCollection(pathname: string, limit = 100) {
  const collection: unknown[] = [];
  let nextHref: string | null = `${SC_API_BASE}${pathname}${pathname.includes("?") ? "&" : "?"}limit=${limit}&linked_partitioning=1`;

  while (nextHref) {
    const response = nextHref.startsWith(SC_API_BASE)
      ? await scRequestAbsolute(nextHref)
      : await scRequest(nextHref.replace(SC_API_BASE, ""));
    const json = (await response.json()) as SoundCloudCollectionPage | unknown[];
    const page = Array.isArray(json) ? { collection: json, next_href: null } : json;
    collection.push(...(page.collection ?? []));
    nextHref = page.next_href ?? null;
  }

  return collection;
}

export async function getMyTracks(limit = 100) {
  const collection = await getPaginatedCollection("/me/tracks", limit);
  return collection.map((track) => sanitizeTrack(track)).filter(isPresent);
}

export async function getMyPlaylists(limit = 100) {
  const collection = await getPaginatedCollection("/me/playlists", limit);
  return collection.map((playlist) => sanitizePlaylist(playlist)).filter(isPresent);
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
