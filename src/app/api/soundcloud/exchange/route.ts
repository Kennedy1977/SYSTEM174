import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/soundcloud";

export const dynamic = "force-dynamic";

const CODE_COOKIE = "sc_oauth_code";
const PKCE_COOKIE = "sc_pkce_verifier";

function readCookieValue(cookieHeader: string, key: string) {
  const parts = cookieHeader.split(";").map((value) => value.trim());
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
    return NextResponse.json(
      { error: "Missing code in exchange payload." },
      { status: 400 },
    );
  }

  try {
    await exchangeCodeForTokens(code, codeVerifier);
  } catch (error) {
    console.error("[soundcloud] exchange endpoint failed", error);
    return NextResponse.json(
      {
        error: "SoundCloud OAuth exchange failed. Check server logs.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CODE_COOKIE, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
  response.cookies.set(PKCE_COOKIE, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
  return response;
}

export async function POST(request: Request) {
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
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  let code =
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
    return NextResponse.json(
      {
        error: "Missing code in exchange payload.",
        debug: {
          url_search: requestUrl.search,
          has_cookie: Boolean(request.headers.get("cookie")),
          has_referer: Boolean(request.headers.get("referer")),
        },
      },
      { status: 400 },
    );
  }

  const verifier = readCookieValue(request.headers.get("cookie") ?? "", PKCE_COOKIE);
  return runExchange(code, verifier);
}
