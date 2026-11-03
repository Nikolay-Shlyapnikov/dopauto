// Builds KIT custom sections: src/sections/<name> + src/shared/base.css -> dist/sections/<name>.
// In template.html, @@word:<file>@@ is replaced with the inline SVG from assets/akony/<file>.svg.
// Usage: node tools/build-sections.mjs [name...]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const srcDir = path.join(root, "src", "sections");
const outDir = path.join(root, "dist", "sections");
const base = fs.readFileSync(path.join(root, "src", "shared", "base.css"), "utf8");

const inlineWord = (_, file) => {
    const svg = fs.readFileSync(path.join(root, "assets", "akony", `${file}.svg`), "utf8").trim();
    return svg
        .replace(/ width="[^"]*" height="[^"]*"/, "")
        .replace("<svg ", '<svg aria-hidden="true" focusable="false" ')
        .replace(/fill="(#E2E2E2|black)"/g, 'fill="currentColor"');
};

const names = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(srcDir);
for (const name of names) {
    const from = path.join(srcDir, name);
    const to = path.join(outDir, name);
    fs.mkdirSync(to, { recursive: true });
    const html = fs.readFileSync(path.join(from, "template.html"), "utf8").replace(/@@word:([\w-]+)@@/g, inlineWord);
    const css = `${base}\n${fs.readFileSync(path.join(from, "styles.css"), "utf8")}`;
    fs.writeFileSync(path.join(to, "template.html"), html);
    fs.writeFileSync(path.join(to, "styles.css"), css);
    fs.copyFileSync(path.join(from, "schema.json"), path.join(to, "schema.json"));
    console.log(`${name}: html ${html.length}, css ${css.length}`);
}
