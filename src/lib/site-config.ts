const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

function getEnvValue(key: string) {
  return process.env[key] ?? metaEnv[key] ?? "";
}

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

export function isSoundCloudPaginationEnabled() {
  return parseBooleanFlag(getEnvValue("SOUNDCLOUD_PAGINATION"), false);
}
