import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(4100),
  API_BASE_URL: z.string().url().default("https://api.andrewkennedydev.com"),
  DATA_DIR: z.string().default("./data"),
  ADMIN_API_KEY: z.string().trim().optional().default(""),
  ALLOWED_ORIGINS: z.string().default(
    "https://system174.co.uk,https://pimpsoul.co.uk,http://localhost:3000,http://127.0.0.1:3000",
  ),
  SOUNDCLOUD_CLIENT_ID: z.string().optional().default(""),
  SOUNDCLOUD_CLIENT_SECRET: z.string().optional().default(""),
  SOUNDCLOUD_REDIRECT_URI: z
    .string()
    .default("https://api.andrewkennedydev.com/v1/admin/soundcloud/callback"),
});

type RawEnv = z.infer<typeof envSchema>;

export type AppEnv = Omit<RawEnv, "ALLOWED_ORIGINS"> & {
  ALLOWED_ORIGINS: string[];
  DATA_DIR_ABSOLUTE: string;
};

let cachedEnv: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid API environment: ${JSON.stringify(flattened)}`);
  }

  const values = parsed.data;

  const nextEnv: AppEnv = {
    ...values,
    ALLOWED_ORIGINS: values.ALLOWED_ORIGINS.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    DATA_DIR_ABSOLUTE: path.resolve(process.cwd(), values.DATA_DIR),
  };

  cachedEnv = nextEnv;

  return nextEnv;
}
