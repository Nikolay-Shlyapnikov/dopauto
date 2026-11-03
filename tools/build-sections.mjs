// Builds KIT custom sections: src/sections/<name> + src/shared/base.css -> dist/sections/<name>.
// template.html:
//   @@word:<file>@@        -> inline SVG from assets/akony/<file>.svg
//   @@repeat N@@ … @@end@@ -> N copies, with @@i@@ replaced by 1..N
// schema.json:
//   "@@repeat": [{ "count": N, "properties": { "item@@i@@Name": {…} }, "defaults": [{ "item@@i@@Name": "…" }, …] }]
//   -> numbered properties item1Name … itemNName, each with its own default
// Numbered fields replace a `modules` array because the KIT settings form does not edit arrays.
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

const expandTemplate = (html) => html
    .replace(/@@repeat (\d+)@@\n?([\s\S]*?)@@end@@\n?/g, (_, count, body) =>
        Array.from({ length: Number(count) }, (__, i) => body.replaceAll("@@i@@", String(i + 1))).join(""))
    .replace(/@@word:([\w-]+)@@/g, inlineWord);

const expandSchema = (schema) => {
    const groups = schema.properties["@@repeat"];
    if (!groups) return schema;
    const properties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
        if (key !== "@@repeat") properties[key] = value;
    }
    for (const group of groups) {
        for (let i = 1; i <= group.count; i++) {
            const defaults = (group.defaults || [])[i - 1] || {};
            for (const [key, prop] of Object.entries(group.properties)) {
                const copy = JSON.parse(JSON.stringify(prop).replaceAll("@@i@@", String(i)));
                if (key in defaults) copy.default = defaults[key];
                properties[key.replaceAll("@@i@@", String(i))] = copy;
            }
        }
    }
    return { ...schema, properties };
};

const names = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(srcDir);
for (const name of names) {
    const from = path.join(srcDir, name);
    const to = path.join(outDir, name);
    fs.mkdirSync(to, { recursive: true });
    const html = expandTemplate(fs.readFileSync(path.join(from, "template.html"), "utf8"));
    const css = `${base}\n${fs.readFileSync(path.join(from, "styles.css"), "utf8")}`;
    const schema = expandSchema(JSON.parse(fs.readFileSync(path.join(from, "schema.json"), "utf8")));
    fs.writeFileSync(path.join(to, "template.html"), html);
    fs.writeFileSync(path.join(to, "styles.css"), css);
    fs.writeFileSync(path.join(to, "schema.json"), `${JSON.stringify(schema, null, 2)}\n`);
    console.log(`${name}: html ${html.length}, css ${css.length}, settings ${Object.keys(schema.properties).length}`);
}
