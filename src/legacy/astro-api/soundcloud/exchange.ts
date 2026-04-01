import type { APIRoute } from "astro";
import { exchangeCodeForTokens } from "../../../lib/soundcloud";

const CODE_COOKIE = "sc_oauth_code";
const PKCE_COOKIE = "sc_pkce_verifier";

function readCookieValue(cookieHeader: string, key: string) {
  const parts = cookieHeader.split(";").map((v) => v.trim());
  for (const part of parts) {
    if (part.startsWith(`${key}=`)) {
      return decodeURIComponent(part.slice(key.length + 1));
    }
  }
  return "";
}

function getCodeFromBody(rawBody: string, contentType: string) {
  if (!rawBody) return "";

  if (contentType.includes("application/json")) {
    try {
      const json = JSON.parse(rawBody) as { code?: string };
      return json.code?.trim() ?? "";
    } catch {
      return "";
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = new URLSearchParams(rawBody);
    return form.get("code")?.trim() ?? "";
  }

  return rawBody.trim();
}

async function runExchange(code: string, codeVerifier: string) {
  if (!code) {
    return new Response(
      JSON.stringify({ error: "Missing code in exchange payload." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    await exchangeCodeForTokens(code, codeVerifier);
  } catch (error) {
    console.error("[soundcloud] exchange endpoint failed", error);
    return new Response(
      JSON.stringify({
        error: "SoundCloud OAuth exchange failed. Check server logs.",
        detail: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${CODE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax, ${PKCE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get("content-type") ?? "";
  const rawBody = await request.text();
  let code = getCodeFromBody(rawBody, contentType);

  if (!code) {
    const referer = request.headers.get("referer") ?? "";
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        code =
          refererUrl.searchParams.get("code") ??
          refererUrl.searchParams.get("authorization_code") ??
          "";
      } catch {
        // Ignore malformed referer and keep current code value.
      }
    }
  }

  const verifier = readCookieValue(request.headers.get("cookie") ?? "", PKCE_COOKIE);
  return runExchange(code, verifier);
};

export const GET: APIRoute = async ({ url, request }) => {
  const requestUrl = new URL(request.url);
  let code =
    url.searchParams.get("code") ??
    requestUrl.searchParams.get("code") ??
    readCookieValue(request.headers.get("cookie") ?? "", CODE_COOKIE);

  if (!code) {
    const referer = request.headers.get("referer") ?? "";
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        code = refererUrl.searchParams.get("code") ?? "";
      } catch {
        // Ignore malformed referer.
      }
    }
  }

  if (!code) {
    return new Response(
      JSON.stringify({
        error: "Missing code in exchange payload.",
        debug: {
          url_search: url.search,
          request_url_search: requestUrl.search,
          has_cookie: Boolean(request.headers.get("cookie")),
          has_referer: Boolean(request.headers.get("referer")),
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const verifier = readCookieValue(request.headers.get("cookie") ?? "", PKCE_COOKIE);
  return runExchange(code ?? "", verifier);
};
