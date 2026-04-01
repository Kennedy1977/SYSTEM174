import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getEnv } from "../config/env.js";

function resolveDocumentPath(relativePath: string) {
  const env = getEnv();
  return path.resolve(env.DATA_DIR_ABSOLUTE, relativePath);
}

async function ensureDocumentDir(relativePath: string) {
  await mkdir(path.dirname(resolveDocumentPath(relativePath)), {
    recursive: true,
  });
}

export async function readDocument<T>(
  relativePath: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const absolutePath = resolveDocumentPath(relativePath);
  const raw = await readFile(absolutePath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  return schema.parse(parsed);
}

export async function writeDocument<T>(
  relativePath: string,
  schema: z.ZodType<T>,
  value: T,
): Promise<T> {
  const absolutePath = resolveDocumentPath(relativePath);
  const validated = schema.parse(value);

  await ensureDocumentDir(relativePath);

  const tempPath = `${absolutePath}.tmp`;
  await writeFile(tempPath, JSON.stringify(validated, null, 2), "utf-8");
  await rename(tempPath, absolutePath);

  return validated;
}

export function getDocumentPath(relativePath: string) {
  return resolveDocumentPath(relativePath);
}
