// Copies Monaco Editor to public/monaco/vs so it is served from our own domain (no CDN dependency).
// Runs on postinstall (on Vercel too). Skips the translations (nls.messages.*) to save ~1 MB.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "monaco-editor", "min", "vs");
const target = join(root, "public", "monaco", "vs");

if (!existsSync(source)) {
  console.warn("[copy-monaco] monaco-editor is not installed yet; skipping.");
  process.exit(0);
}
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, {
  recursive: true,
  filter: (src) => !/nls\.messages\.[a-z-]+\.js(\.map)?$/i.test(src),
});
console.log("[copy-monaco] Monaco copied to public/monaco/vs");
