import { readDocument, writeDocument } from "../../lib/document-store.js";
import { getEnv } from "../../config/env.js";
import { savePlaylistsDocument, saveTracksDocument } from "../catalog/service.js";
import {
  soundCloudDashboardDataSchema,
  soundCloudIntegrationDocumentSchema,
  updateSoundCloudTokensSchema,
} from "./schema.js";

const SC_API_BASE = "https://api.soundcloud.com";
const SC_OAUTH_BASE = "https://secure.soundcloud.com";
const SOUNDCLOUD_DOCUMENT_PATH = "integrations/soundcloud.json";
const SYNC_STATE_PATH = "sync/state.json";

type SoundCloudTrack = {
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

type SoundCloudPlaylist = {
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

type SoundCloudMe = {
  id: number;
  username: string;
  avatar_url: string | null;
  permalink_url: string;
};

type SoundCloudDashboardData = {
  me: SoundCloudMe | null;
  tracks: SoundCloudTrack[];
  playlists: SoundCloudPlaylist[];
};

type OAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
};

type SoundCloudCollectionPage = {
  collection?: unknown[];
  next_href?: string | null;
};

let refreshPromise: Promise<void> | null = null;

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

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
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

  return search ? `${upgradedPathname}?${search}` : upgradedPathname;
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

function buildTrackDocument(track: SoundCloudTrack) {
  return {
    id: track.id,
    title: track.title,
    genre: track.genre ?? "",
    artworkUrl: track.artwork_url ?? "",
    permalinkUrl: track.permalink_url,
    createdAt: track.created_at,
    updatedAt: new Date().toISOString(),
    source: "soundcloud" as const,
  };
}

function buildPlaylistDocument(playlist: SoundCloudPlaylist) {
  return {
    id: playlist.id,
    title: playlist.title,
    genre: playlist.genre ?? "",
    artworkUrl: playlist.artwork_url ?? "",
    permalinkUrl: playlist.permalink_url,
    trackIds: (playlist.tracks ?? []).map((track) => track.id),
    createdAt: playlist.created_at,
    updatedAt: new Date().toISOString(),
    source: "soundcloud" as const,
  };
}

function getAuthEnv() {
  const env = getEnv();
  return {
    clientId: env.SOUNDCLOUD_CLIENT_ID,
    clientSecret: env.SOUNDCLOUD_CLIENT_SECRET,
    redirectUri: env.SOUNDCLOUD_REDIRECT_URI,
    envAccessToken: process.env.SOUNDCLOUD_ACCESS_TOKEN?.trim() ?? "",
    envRefreshToken: process.env.SOUNDCLOUD_REFRESH_TOKEN?.trim() ?? "",
  };
}

function hasOAuthClientConfig() {
  const { clientId, clientSecret, redirectUri } = getAuthEnv();
  return Boolean(clientId && clientSecret && redirectUri);
}

export async function getSoundCloudIntegration() {
  return readDocument(SOUNDCLOUD_DOCUMENT_PATH, soundCloudIntegrationDocumentSchema);
}

async function saveSoundCloudIntegration(
  updater: (
    current: Awaited<ReturnType<typeof getSoundCloudIntegration>>,
  ) => Awaited<ReturnType<typeof getSoundCloudIntegration>>,
) {
  const current = await getSoundCloudIntegration();
  const next = updater(current);
  return writeDocument(
    SOUNDCLOUD_DOCUMENT_PATH,
    soundCloudIntegrationDocumentSchema,
    next,
  );
}

async function hydrateSoundCloudDocumentFromEnv() {
  const authEnv = getAuthEnv();
  const current = await getSoundCloudIntegration();

  const next = {
    ...current,
    updatedAt: current.updatedAt,
    oauth: {
      clientId: authEnv.clientId || current.oauth.clientId,
      clientSecretConfigured:
        Boolean(authEnv.clientSecret) || current.oauth.clientSecretConfigured,
      redirectUri: authEnv.redirectUri || current.oauth.redirectUri,
    },
    tokens: {
      accessToken: current.tokens.accessToken || authEnv.envAccessToken,
      refreshToken: current.tokens.refreshToken || authEnv.envRefreshToken,
      updatedAt:
        current.tokens.updatedAt ??
        ((authEnv.envAccessToken || authEnv.envRefreshToken)
          ? new Date().toISOString()
          : null),
    },
  };

  if (JSON.stringify(next) !== JSON.stringify(current)) {
    await writeDocument(
      SOUNDCLOUD_DOCUMENT_PATH,
      soundCloudIntegrationDocumentSchema,
      next,
    );
    return next;
  }

  return current;
}

async function getEffectiveTokens() {
  const integration = await hydrateSoundCloudDocumentFromEnv();
  const authEnv = getAuthEnv();

  return {
    accessToken: integration.tokens.accessToken || authEnv.envAccessToken,
    refreshToken: integration.tokens.refreshToken || authEnv.envRefreshToken,
    integration,
  };
}

async function persistTokens(accessToken: string, refreshToken: string) {
  const updatedAt = new Date().toISOString();
  return saveSoundCloudIntegration((current) => ({
    ...current,
    updatedAt,
    oauth: {
      clientId: getAuthEnv().clientId || current.oauth.clientId,
      clientSecretConfigured:
        Boolean(getAuthEnv().clientSecret) || current.oauth.clientSecretConfigured,
      redirectUri: getAuthEnv().redirectUri || current.oauth.redirectUri,
    },
    tokens: {
      accessToken,
      refreshToken,
      updatedAt,
    },
  }));
}

async function updateSyncState(
  status: "idle" | "running" | "failed" | "ok",
  message: string | null,
) {
  const current = await getSoundCloudIntegration();
  const updatedAt = new Date().toISOString();

  return writeDocument(
    SOUNDCLOUD_DOCUMENT_PATH,
    soundCloudIntegrationDocumentSchema,
    {
      ...current,
      updatedAt,
      sync: {
        status,
        lastSyncAt:
          status === "ok" || status === "failed"
            ? updatedAt
            : current.sync.lastSyncAt,
        message,
      },
    },
  );
}

function buildAuthorizeUrl() {
  const { clientId, redirectUri } = getAuthEnv();

  if (!clientId || !redirectUri) {
    throw new Error("Missing SoundCloud OAuth client configuration");
  }

  const authorizeUrl = new URL(`${SC_OAUTH_BASE}/authorize`);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");

  return authorizeUrl.toString();
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

export async function exchangeCodeForTokens(code: string) {
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

  const response = await fetch(`${SC_OAUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `SoundCloud code exchange failed (${response.status}): ${detail}`,
    );
  }

  const json = (await response.json()) as OAuthTokenResponse;
  await persistTokens(json.access_token, json.refresh_token ?? "");

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? "",
  };
}

export async function refreshAccessToken() {
  if (refreshPromise) {
    await refreshPromise;
    return;
  }

  refreshPromise = (async () => {
    if (!hasOAuthClientConfig()) {
      throw new Error("Missing SoundCloud OAuth client configuration");
    }

    const { refreshToken } = await getEffectiveTokens();

    if (!refreshToken) {
      throw new Error("Missing SoundCloud refresh token");
    }

    const response = await requestTokenRefresh(refreshToken);
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `SoundCloud token refresh failed (${response.status}): ${detail}`,
      );
    }

    const json = (await response.json()) as OAuthTokenResponse;
    await persistTokens(json.access_token, json.refresh_token ?? refreshToken);
  })();

  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function scRequest(pathname: string, init?: RequestInit) {
  let { accessToken } = await getEffectiveTokens();

  if (!accessToken) {
    await refreshAccessToken();
    accessToken = (await getEffectiveTokens()).accessToken;
  }

  const makeRequest = async (token: string) =>
    fetch(`${SC_API_BASE}${pathname}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `OAuth ${token}`,
      },
    });

  let response = await makeRequest(accessToken);

  if (response.status === 401) {
    await refreshAccessToken();
    response = await makeRequest((await getEffectiveTokens()).accessToken);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `SoundCloud request failed (${response.status}) for ${pathname}: ${detail}`,
    );
  }

  return response;
}

async function scRequestAbsolute(url: string, init?: RequestInit) {
  let { accessToken } = await getEffectiveTokens();

  if (!accessToken) {
    await refreshAccessToken();
    accessToken = (await getEffectiveTokens()).accessToken;
  }

  const makeRequest = async (token: string) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `OAuth ${token}`,
      },
    });

  let response = await makeRequest(accessToken);

  if (response.status === 401) {
    await refreshAccessToken();
    response = await makeRequest((await getEffectiveTokens()).accessToken);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `SoundCloud request failed (${response.status}) for ${url}: ${detail}`,
    );
  }

  return response;
}

async function getMe() {
  const response = await scRequest("/me");
  return sanitizeMe(await response.json());
}

async function getPaginatedCollection(pathname: string, limit = 100) {
  const collection: unknown[] = [];
  let nextHref: string | null = `${SC_API_BASE}${pathname}${
    pathname.includes("?") ? "&" : "?"
  }limit=${limit}&linked_partitioning=1`;

  while (nextHref) {
    const response = nextHref.startsWith(SC_API_BASE)
      ? await scRequestAbsolute(nextHref)
      : await scRequest(nextHref.replace(SC_API_BASE, ""));
    const json = (await response.json()) as SoundCloudCollectionPage | unknown[];
    const page = Array.isArray(json)
      ? { collection: json, next_href: null }
      : json;
    collection.push(...(page.collection ?? []));
    nextHref = page.next_href ?? null;
  }

  return collection;
}

async function getMyTracks(limit = 100) {
  const collection = await getPaginatedCollection("/me/tracks", limit);
  return collection.map((track) => sanitizeTrack(track)).filter(isPresent);
}

async function getMyPlaylists(limit = 100) {
  const collection = await getPaginatedCollection("/me/playlists", limit);
  return collection
    .map((playlist) => sanitizePlaylist(playlist))
    .filter(isPresent);
}

export async function getSoundCloudDashboardData(): Promise<SoundCloudDashboardData> {
  await hydrateSoundCloudDocumentFromEnv();

  if (!hasOAuthClientConfig()) {
    return {
      me: null,
      tracks: [],
      playlists: [],
    };
  }

  const { accessToken, refreshToken } = await getEffectiveTokens();
  if (!accessToken && !refreshToken) {
    return {
      me: null,
      tracks: [],
      playlists: [],
    };
  }

  const [me, tracks, playlists] = await Promise.all([
    getMe(),
    getMyTracks(100),
    getMyPlaylists(100),
  ]);

  return soundCloudDashboardDataSchema.parse({
    me,
    tracks,
    playlists,
  });
}

export async function getSoundCloudStatus() {
  const env = getEnv();
  const integration = await hydrateSoundCloudDocumentFromEnv();
  const authConfig = getAuthEnv();
  const hasClientConfig = hasOAuthClientConfig();
  const hasAccessToken = Boolean(
    integration.tokens.accessToken || authConfig.envAccessToken,
  );
  const hasRefreshToken = Boolean(
    integration.tokens.refreshToken || authConfig.envRefreshToken,
  );

  const baseStatus = {
    checkedAt: new Date().toISOString(),
    hasClientConfig,
    hasAccessToken,
    hasRefreshToken,
    redirectUri: authConfig.redirectUri,
    me: null as SoundCloudMe | null,
    trackCount: 0,
    playlistCount: 0,
    sync: integration.sync,
  };

  if (!hasClientConfig) {
    return {
      ...baseStatus,
      status: "missing_config",
      message:
        "SoundCloud OAuth client configuration is missing from the environment.",
      error: null,
    };
  }

  if (!hasAccessToken && !hasRefreshToken) {
    return {
      ...baseStatus,
      status: "missing_tokens",
      message:
        "No SoundCloud access or refresh token is available in env or documents.",
      error: null,
    };
  }

  try {
    const dashboard = await getSoundCloudDashboardData();
    return {
      ...baseStatus,
      status: "ok",
      message: "SoundCloud configuration, tokens, and API requests are working.",
      error: null,
      me: dashboard.me,
      trackCount: dashboard.tracks.length,
      playlistCount: dashboard.playlists.length,
      dataDir: env.DATA_DIR_ABSOLUTE,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...baseStatus,
      status: message.includes("refresh") ? "refresh_failed" : "api_failed",
      message:
        "SoundCloud integration exists, but the API request path is not healthy.",
      error: message,
      dataDir: env.DATA_DIR_ABSOLUTE,
    };
  }
}

export async function updateSoundCloudTokens(payload: unknown) {
  const parsed = updateSoundCloudTokensSchema.parse(payload);
  return persistTokens(parsed.accessToken, parsed.refreshToken);
}

export async function syncSoundCloudCatalog() {
  await updateSyncState("running", "Syncing tracks and playlists from SoundCloud.");

  try {
    const dashboard = await getSoundCloudDashboardData();
    const updatedAt = new Date().toISOString();

    await saveTracksDocument({
      version: 1,
      updatedAt,
      tracks: dashboard.tracks.map((track) => buildTrackDocument(track)),
    });

    await savePlaylistsDocument({
      version: 1,
      updatedAt,
      playlists: dashboard.playlists.map((playlist) =>
        buildPlaylistDocument(playlist),
      ),
    });

    await updateSyncState(
      "ok",
      `Synced ${dashboard.tracks.length} tracks and ${dashboard.playlists.length} playlists.`,
    );

    return {
      ok: true,
      updatedAt,
      trackCount: dashboard.tracks.length,
      playlistCount: dashboard.playlists.length,
      me: dashboard.me,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateSyncState("failed", message);
    throw error;
  }
}

export async function markSyncRequested() {
  return syncSoundCloudCatalog();
}

export function getSoundCloudAuthorizeUrl() {
  return buildAuthorizeUrl();
}

export function getSoundCloudSyncStateDocumentPath() {
  return SYNC_STATE_PATH;
}
