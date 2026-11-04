// Upscales images for the KIT settings form, which rejects pictures smaller than 500px.
// Lanczos, proportions kept, the larger side becomes SIZE (default 600, a margin over 500).
// Pictures that are already big enough are skipped; the originals are never touched.
// Usage: node tools/upscale.mjs <file-or-folder> <out-folder> [size]
//   a folder is walked recursively and its structure is repeated in <out-folder>
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [src, out, size = "600"] = process.argv.slice(2);
if (!src || !out) {
    console.error("Usage: node tools/upscale.mjs <file-or-folder> <out-folder> [size]");
    process.exit(2);
}
const target = Number(size);

const walk = (p) => fs.statSync(p).isDirectory()
    ? fs.readdirSync(p).flatMap((name) => walk(path.join(p, name)))
    : [p];

const base = fs.statSync(src).isDirectory() ? src : path.dirname(src);
for (const file of walk(src).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))) {
    const { width, height } = await sharp(file).metadata();
    const rel = path.relative(base, file);
    if (Math.max(width, height) >= target) {
        console.log(`${rel}: ${width}x${height} — уже достаточно, пропущен`);
        continue;
    }
    const k = target / Math.max(width, height);
    const w = Math.round(width * k);
    const h = Math.round(height * k);
    const dst = path.join(out, rel).replace(/\.(jpe?g|webp)$/i, ".png");
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    await sharp(file).resize(w, h, { kernel: "lanczos3" }).png({ compressionLevel: 9 }).toFile(dst);
    console.log(`${rel}: ${width}x${height} -> ${w}x${h}`);
}
