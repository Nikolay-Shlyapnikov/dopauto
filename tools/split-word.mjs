// Splits a single-path outlined word SVG into two lines after N letters.
// Usage: node split-word.mjs in.svg out.svg <lettersInFirstLine> <lineStep>
import fs from "node:fs";

const [src, out, firstCount, lineStepArg] = process.argv.slice(2);
const svg = fs.readFileSync(src, "utf8");
const d = svg.match(/ d="([^"]+)"/)[1];
const fill = svg.match(/<path[^>]* fill="([^"]+)"/)[1];

// Tokenize absolute commands (Figma emits uppercase M L H V C Z).
const tokens = d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
const subpaths = [];
let cur = null, cmd = null, x = 0, y = 0;
for (let i = 0; i < tokens.length;) {
  const t = tokens[i];
  if (/^[A-Za-z]$/.test(t)) {
    cmd = t; i++;
    if (cmd === "M") { cur = { cmds: [], minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }; subpaths.push(cur); }
    if (cmd === "Z" || cmd === "z") { cur.cmds.push(["Z"]); }
    continue;
  }
  const take = (n) => tokens.slice(i, (i += n)).map(Number);
  const track = (px, py) => {
    cur.minX = Math.min(cur.minX, px); cur.maxX = Math.max(cur.maxX, px);
    cur.minY = Math.min(cur.minY, py); cur.maxY = Math.max(cur.maxY, py);
  };
  if (cmd === "M" || cmd === "L") { [x, y] = take(2); cur.cmds.push([cmd, x, y]); track(x, y); }
  else if (cmd === "H") { [x] = take(1); cur.cmds.push(["H", x]); track(x, y); }
  else if (cmd === "V") { [y] = take(1); cur.cmds.push(["V", y]); track(x, y); }
  else if (cmd === "C") { const a = take(6); cur.cmds.push(["C", ...a]); [x, y] = [a[4], a[5]]; track(a[0], a[1]); track(a[2], a[3]); track(x, y); }
  else throw new Error("unsupported command " + cmd);
}

// Group subpaths into letters: a subpath whose bbox lies inside another subpath's bbox is a counter of that letter.
const inside = (a, b) => a !== b && a.minX >= b.minX && a.maxX <= b.maxX && a.minY >= b.minY && a.maxY <= b.maxY;
const letters = subpaths
  .filter((sp) => !subpaths.some((o) => inside(sp, o)))
  .map((outer) => ({ parts: [outer, ...subpaths.filter((sp) => inside(sp, outer))], minX: outer.minX, maxX: outer.maxX }))
  .sort((a, b) => a.minX - b.minX);
console.log("letters:", letters.length, letters.map((l) => `${l.minX.toFixed(0)}-${l.maxX.toFixed(0)}`).join(" "));

const n = Number(firstCount), lineStep = Number(lineStepArg);
const dx = letters[n].minX - letters[0].minX;
const fmt = (v) => +v.toFixed(3);
const render = (sp, ox, oy) => sp.cmds.map(([c, ...a]) => {
  if (c === "Z") return "Z";
  if (c === "H") return "H" + fmt(a[0] - ox);
  if (c === "V") return "V" + fmt(a[0] + oy);
  const pts = [];
  for (let k = 0; k < a.length; k += 2) pts.push(`${fmt(a[k] - ox)} ${fmt(a[k + 1] + oy)}`);
  return c + pts.join(" ");
}).join("");

let path = "", width = 0;
letters.forEach((l, idx) => {
  const second = idx >= n;
  for (const sp of l.parts) path += render(sp, second ? dx : 0, second ? lineStep : 0);
  width = Math.max(width, second ? l.maxX - dx : l.maxX);
});
const height = Number(svg.match(/height="([\d.]+)"/)[1]) + lineStep;
width = Math.ceil(width);
fs.writeFileSync(out, `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="${path}" fill="${fill}"/>\n</svg>\n`);
console.log("wrote", out, width + "x" + height);
