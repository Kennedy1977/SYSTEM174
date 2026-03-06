import { writeFile } from "node:fs/promises";
import path from "node:path";

const SC_API_BASE = "https://api.soundcloud.com";
const SC_OAUTH_BASE = "https://secure.soundcloud.com";
const DEV_TOKENS_PATH = path.resolve(process.cwd(), ".soundcloud.tokens.json");

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

type TokenState = {
  accessToken: string;
  refreshToken: string;
};

const tokenState: TokenState = {
  accessToken: getEnvValue("SOUNDCLOUD_ACCESS_TOKEN"),
  refreshToken: getEnvValue("SOUNDCLOUD_REFRESH_TOKEN"),
};

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
    await writeFile(DEV_TOKENS_PATH, JSON.stringify(payload, null, 2), "utf-8");
  } catch (error) {
    console.warn("[soundcloud] unable to write local token cache", error);
  }
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
  console.info("[soundcloud] received OAuth tokens; copy values from .soundcloud.tokens.json into .env");
}

export async function refreshAccessToken() {
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
}

export async function scRequest(pathname: string, init?: RequestInit) {
  if (!hasAccessToken()) {
    throw new Error("Missing SoundCloud access token");
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
  return (await response.json()) as SoundCloudMe;
}

export async function getMyTracks(limit = 12) {
  const response = await scRequest(`/me/tracks?limit=${limit}&linked_partitioning=1`);
  const json = (await response.json()) as { collection?: SoundCloudTrack[] } | SoundCloudTrack[];
  if (Array.isArray(json)) {
    return json;
  }
  return json.collection ?? [];
}

export async function getMyPlaylists(limit = 12) {
  const response = await scRequest(`/me/playlists?limit=${limit}&linked_partitioning=1`);
  const json = (await response.json()) as { collection?: SoundCloudPlaylist[] } | SoundCloudPlaylist[];
  if (Array.isArray(json)) {
    return json;
  }
  return json.collection ?? [];
}

export async function getSoundCloudDashboardData(): Promise<SoundCloudDashboardData> {
  if (!hasOAuthClientConfig() || !hasAccessToken()) {
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
