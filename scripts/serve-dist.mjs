import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("dist");
const port = Number(process.env.PORT || 4173);
const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const relative = pathname === "/" ? "index.html" : normalize(pathname).replace(/^[/\\]+/, "");
    let file = join(root, relative);
    if (!file.startsWith(root)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    } catch {
      file = join(root, "index.html");
    }

    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(500).end("Server error");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Site assistant preview: http://127.0.0.1:${port}`);
});
