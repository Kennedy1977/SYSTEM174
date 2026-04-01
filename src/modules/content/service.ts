import { readDocument, writeDocument } from "../../lib/document-store.js";
import {
  type SiteContentDocument,
  type SiteKey,
  siteContentSchema,
} from "./schema.js";

function getSiteDocumentPath(site: SiteKey) {
  return `sites/${site}.json`;
}

export async function getSiteContent(site: SiteKey) {
  return readDocument(getSiteDocumentPath(site), siteContentSchema);
}

export async function saveSiteContent(
  site: SiteKey,
  value: SiteContentDocument,
) {
  return writeDocument(getSiteDocumentPath(site), siteContentSchema, value);
}
