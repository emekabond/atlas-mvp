import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function serveStatic(app: Express) {
  // adjust this path to where the built client actually lives
  const distPath = path.resolve(__dirname, "../client/dist");

  if (!fs.existsSync(distPath)) {
    // log but do NOT crash the server
    console.error(
      `Static assets directory not found at ${distPath}. ` +
        "API will still run, but frontend assets are missing."
    );
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html for all non-API routes
  app.get("/*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
