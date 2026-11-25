import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};
const publicFiles = new Set(["index.html", "studio.html", "style.css", "profile.json", "model.js", "public.js", "studio.js"]);
const port = Number(process.argv[2] || 4173);

createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname.slice(1) || "index.html";
  if (!publicFiles.has(path)) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const file = await readFile(new URL(`./docs/${path}`, import.meta.url));
    response.writeHead(200, { "Content-Type": contentTypes[extname(path)], "Cache-Control": "no-store" }).end(file);
  } catch {
    response.writeHead(500).end("Could not read preview file");
  }
}).listen(port, "127.0.0.1", () => console.log(`Local preview: http://127.0.0.1:${port}/`));
