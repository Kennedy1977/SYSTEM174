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

function callbackBridgeHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SoundCloud Callback</title>
  </head>
  <body style="font-family: Inter, system-ui, sans-serif; background:#0A0C10; color:#E7EDF6; padding:24px;">
    <p>Finishing SoundCloud connection...</p>
    <script>
      (async () => {
        const getCookie = (name) => {
          const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
          return match ? decodeURIComponent(match[1]) : '';
        };
        const params = new URLSearchParams(window.location.search);
        const hrefMatch = window.location.href.match(/[?&]code=([^&#]+)/);
        const code = params.get("code") || (hrefMatch ? decodeURIComponent(hrefMatch[1]) : "") || getCookie("sc_oauth_code");
        const error = params.get("error");
        const errorDescription = params.get("error_description");

        if (error) {
          document.body.innerHTML = '<pre style="white-space:pre-wrap;">' + JSON.stringify({
            error: "SoundCloud OAuth returned an error",
            provider_error: error,
            provider_error_description: errorDescription
          }, null, 2) + '</pre>';
          return;
        }

        if (!code) {
          document.body.innerHTML = '<pre style="white-space:pre-wrap;">' + JSON.stringify({
            error: "Missing ?code in SoundCloud callback (browser-side)",
            received_query: window.location.search,
            has_cookie_code: !!getCookie("sc_oauth_code")
          }, null, 2) + '</pre>';
          return;
        }
        const res = await fetch("/api/soundcloud/exchange?code=" + encodeURIComponent(code), {
          method: "GET",
        });
        if (!res.ok) {
          const text = await res.text();
          document.body.innerHTML = '<pre style="white-space:pre-wrap;">' + text + '</pre>';
          return;
        }
        window.location.href = "/?sc=connected";
      })();
    </script>
  </body>
</html>`;
}

export const GET: APIRoute = async ({ url, request }) => {
  const requestUrl = new URL(request.url);
  const error = url.searchParams.get("error") ?? requestUrl.searchParams.get("error");
  const errorDescription =
    url.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error_description");
  const code =
    url.searchParams.get("code") ??
    requestUrl.searchParams.get("code") ??
    url.searchParams.get("authorization_code") ??
    requestUrl.searchParams.get("authorization_code") ??
    readCookieValue(request.headers.get("cookie") ?? "", CODE_COOKIE);

  if (error) {
    return new Response(
      JSON.stringify({
        error: "SoundCloud OAuth returned an error",
        provider_error: error,
        provider_error_description: errorDescription ?? null,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!code) {
    return new Response(callbackBridgeHtml(), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const verifier = readCookieValue(request.headers.get("cookie") ?? "", PKCE_COOKIE);
    await exchangeCodeForTokens(code, verifier);
  } catch (error) {
    console.error("[soundcloud] callback exchange failed", error);
    return new Response("SoundCloud OAuth exchange failed. Check server logs.", { status: 500 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL("/?sc=connected", url).toString(),
      "Set-Cookie": `${CODE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax, ${PKCE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
    },
  });
};

export const POST: APIRoute = async ({ request, url }) => {
  let code = url.searchParams.get("code") ?? "";

  if (!code) {
    const contentType = request.headers.get("content-type") ?? "";
    const rawBody = await request.text();

    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(rawBody) as { code?: string };
        code = json.code ?? "";
      } catch {
        code = "";
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = new URLSearchParams(rawBody);
      code = form.get("code") ?? "";
    } else if (rawBody) {
      // Accept plain-text code payloads as a final fallback.
      code = rawBody.trim();
    }
  }

  if (!code) {
    return new Response(
      JSON.stringify({
        error: "Missing code in callback payload.",
        hint: "Send ?code=... or JSON/form body with a code field.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    await exchangeCodeForTokens(code);
  } catch (error) {
    console.error("[soundcloud] callback exchange failed (POST bridge)", error);
    return new Response(
      JSON.stringify({ error: "SoundCloud OAuth exchange failed. Check server logs." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, redirect: new URL("/?sc=connected", url).toString() }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
