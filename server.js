import express from "express";
import { handler } from "./dist/server/entry.mjs";

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

// Serve Astro client assets before handing off to SSR.
app.use(express.static("dist/client"));
app.use(handler);

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
