import { z } from "zod";

export const siteKeySchema = z.enum(["system174", "pimpsoul"]);

export const siteContentSchema = z.object({
  slug: siteKeySchema,
  siteUrl: z.string().url(),
  name: z.string(),
  navLabel: z.string(),
  title: z.string(),
  defaultDescription: z.string(),
  socialImageAlt: z.string(),
  controllerName: z.string(),
  consentCookieName: z.string(),
  profileDescription: z.string(),
  personDescription: z.string(),
  musicGroupId: z.string(),
  musicGroupName: z.string(),
  musicGroupAlternateName: z.string(),
  musicGroupDescription: z.string(),
  musicGroupGenre: z.array(z.string()),
  sameAs: z.array(z.string().url()),
  theme: z.object({
    accent: z.string(),
    headingFont: z.string(),
    backgroundImage: z.string(),
  }),
});

export type SiteKey = z.infer<typeof siteKeySchema>;
export type SiteContentDocument = z.infer<typeof siteContentSchema>;
