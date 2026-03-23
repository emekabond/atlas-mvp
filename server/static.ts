import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function serveStatic(app: Express) {
  // Vite builds the client + index.html into the root dist/ folder
  const distPath = path.resolve(__dirname, "../dist");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Static assets directory not found at ${distPath}. ` +
        "API will still run, but frontend assets are missing."
    );
    return;
  }

  app.use(express.static(distPath));

  // SPA-style catch-all for the dashboard
  app.get("/*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
