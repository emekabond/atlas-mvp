import express, { type Express } from "express"; import fs from "fs"; import path, { dirname } from "path"; import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename);

export function serveStatic(app: Express) {
  // Vite builds into dist/public (see build logs)
  const distPath = path.resolve(__dirname, "../dist/public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Static assets directory not found at ${distPath}. ` +
        "API will still run, but frontend assets are missing."
    );
    return;
  }

  app.use(express.static(distPath));

  app.get("/", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
