import crypto from "node:crypto";

export const ADMIN_SESSION_COOKIE_NAME = "system174_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function timingSafeEqual(left: string, right: string) {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getEnvValue(key: string) {
  return process.env[key] ?? "";
}

export function getAdminDashboardPassword() {
  const configuredPassword = getEnvValue("ADMIN_DASHBOARD_PASSWORD").trim();
  if (configuredPassword) {
    return configuredPassword;
  }

  return getEnvValue("SOUNDCLOUD_TOKEN_EXPORT_KEY").trim();
}

export function isAdminDashboardConfigured() {
  return Boolean(getAdminDashboardPassword());
}

export function createAdminSessionToken(
  password = getAdminDashboardPassword(),
) {
  if (!password) {
    return "";
  }

  return crypto
    .createHash("sha256")
    .update(`system174-admin:${password}`)
    .digest("hex");
}

export function isAdminSessionTokenValid(token: string) {
  const expected = createAdminSessionToken();

  if (!expected) {
    return false;
  }

  return timingSafeEqual(token, expected);
}

function parseCookieHeader(cookieHeader: string) {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((all, part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        all[part] = "";
        return all;
      }

      const name = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      all[name] = decodeURIComponent(value);
      return all;
    }, {});
}

export function getAdminSessionTokenFromCookieHeader(cookieHeader: string) {
  return parseCookieHeader(cookieHeader)[ADMIN_SESSION_COOKIE_NAME] ?? "";
}

export function hasAuthorizedAdminSession(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return isAdminSessionTokenValid(
    getAdminSessionTokenFromCookieHeader(cookieHeader),
  );
}

export function matchesAdminPassword(password: string) {
  const configuredPassword = getAdminDashboardPassword();
  if (!configuredPassword) {
    return false;
  }

  return timingSafeEqual(password.trim(), configuredPassword);
}

export function getAdminSessionCookieValue() {
  return createAdminSessionToken();
}
