import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSoundCloudAuthConfig } from "@/lib/soundcloud";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const { clientId, redirectUri, hasClientConfig } = getSoundCloudAuthConfig();

  if (!hasClientConfig || !clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing SoundCloud OAuth configuration in environment variables" },
      { status: 500 },
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

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("sc_pkce_verifier", verifier, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
