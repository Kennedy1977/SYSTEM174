import pimpsoulContent from "@/content/content.pimpsoul.json";
import system174Content from "@/content/content.system174.json";
import { getSiteVariant } from "@/lib/site-config";

export type SiteContent = typeof system174Content;

const contentByVariant = {
  system174: system174Content,
  pimpsoul: pimpsoulContent,
} as const satisfies Record<ReturnType<typeof getSiteVariant>, SiteContent>;

export function getSiteContent() {
  return contentByVariant[getSiteVariant()];
}

export const siteContent = getSiteContent();
