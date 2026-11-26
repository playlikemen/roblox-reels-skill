// Static server with HTTP Range (video seeking). "/" and "/model" both serve the reels page.
import http from "http"; import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const root = path.dirname(fileURLToPath(import.meta.url)), PORT = Number(process.env.PORT || 4830);
const T = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".mov": "video/quicktime", ".txt": "text/plain; charset=utf-8", ".csv": "text/csv; charset=utf-8" };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/" || p === "/model" || p === "/model/") p = "/index.html";
  const f = path.join(root, path.normalize(p));
  if (!f.startsWith(root) || f.endsWith("server.mjs") || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end("not found"); }
  const size = fs.statSync(f).size, type = T[path.extname(f)] || "application/octet-stream", r = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (r) {
    const s = r[1] ? Number(r[1]) : size - Number(r[2]), e = r[1] && r[2] ? Math.min(Number(r[2]), size - 1) : size - 1;
    if (s >= size || s > e) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); return res.end(); }
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${s}-${e}/${size}`, "Accept-Ranges": "bytes", "Content-Length": e - s + 1 });
    return fs.createReadStream(f, { start: s, end: e }).pipe(res);
  }
  res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log("reels on", PORT));
