export type PageSearchParams = Record<string, string | string[] | undefined>;

export async function resolvePageSearchParams(
  input?: Promise<PageSearchParams> | PageSearchParams,
) {
  return await Promise.resolve(input ?? {});
}

export function getSearchParamValue(
  params: PageSearchParams,
  key: string,
) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}
