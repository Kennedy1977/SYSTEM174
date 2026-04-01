import type { APIRoute } from "astro";
import crypto from "node:crypto";
import { getSoundCloudAuthConfig } from "../../../lib/soundcloud";

function toBase64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makePkcePair() {
  const verifier = toBase64Url(crypto.randomBytes(64));
  const challenge = toBase64Url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export const GET: APIRoute = async () => {
  const { clientId, redirectUri, hasClientConfig } = getSoundCloudAuthConfig();

  if (!hasClientConfig || !clientId || !redirectUri) {
    return new Response(
      JSON.stringify({ error: "Missing SoundCloud OAuth configuration in environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const authorizeUrl = new URL("https://secure.soundcloud.com/authorize");
  const { verifier, challenge } = makePkcePair();
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "non-expiring");
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      "Set-Cookie": `sc_pkce_verifier=${encodeURIComponent(verifier)}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax`,
    },
  });
};
