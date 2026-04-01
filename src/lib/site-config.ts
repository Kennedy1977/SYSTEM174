function getEnvValue(key: string) {
  return process.env[key] ?? "";
}

export type SiteVariant = "system174" | "pimpsoul";

function parseBooleanFlag(value: string, defaultValue = false) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return defaultValue;
  }

  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off", "disabled"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

export function getSiteVariant(): SiteVariant {
  const explicitVariant = getEnvValue("SITE_VARIANT").trim().toLowerCase();

  if (explicitVariant === "pimpsoul") {
    return "pimpsoul";
  }

  if (explicitVariant === "system174") {
    return "system174";
  }

  const siteUrl = getEnvValue("SITE_URL").trim().toLowerCase();
  if (siteUrl.includes("pimpsoul.co.uk")) {
    return "pimpsoul";
  }

  return "system174";
}

export function isSoundCloudPaginationEnabled() {
  return parseBooleanFlag(getEnvValue("SOUNDCLOUD_PAGINATION"), false);
}
