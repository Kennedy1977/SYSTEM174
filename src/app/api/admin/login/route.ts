import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  getAdminSessionCookieValue,
  isAdminDashboardConfigured,
  matchesAdminPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type LoginRequestBody = {
  password?: string;
};

export async function POST(request: Request) {
  if (!isAdminDashboardConfigured()) {
    return NextResponse.json(
      { error: "Admin dashboard access is not configured on the server." },
      { status: 404 },
    );
  }

  let password = "";

  try {
    const body = (await request.json()) as LoginRequestBody;
    password = body.password?.trim() ?? "";
  } catch {
    password = "";
  }

  if (!matchesAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    message: "Admin access granted.",
  });

  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, getAdminSessionCookieValue(), {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
