// one bundle, many stills (run from the project folder): node stills.mjs <outprefix> <f1,f2,...> [scale]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
const [pre, list, scale = "0.5"] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const opts = { serveUrl, id: "HatTown", chromiumOptions: { gl: "swangle" } };
const composition = await selectComposition(opts);
const frames = list.split(",").map(Number);
const t0 = Date.now();
await Promise.all(frames.map((frame) => renderStill({ ...opts, composition, frame, output: `${pre}${String(frame).padStart(4, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 85, scale: Number(scale), chromiumOptions: { gl: "swangle" } })));
console.log("done", frames.length, "stills", (Date.now() - t0) / 1000, "s");
