/**
 * Supported languages and automatic detection (isomorphic: used by the editor and the forms).
 *
 * Decision: heuristic detection by scoring patterns (no dependencies). For a handful of well-known
 * languages it is enough, instant and predictable; people can always pick the language by hand.
 */

import { maxBy, recordFromKeys } from "./collections";

export const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "csharp", label: "C#" },
  { id: "php", label: "PHP" },
  { id: "sql", label: "SQL" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];
export type LanguageOrPlain = LanguageId | "plaintext";

export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id) as [LanguageId, ...LanguageId[]];

const EXTENSIONS: Record<string, LanguageId> = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  java: "java",
  cs: "csharp",
  php: "php",
  sql: "sql",
  html: "html",
  htm: "html",
  css: "css",
};

export function languageFromFilename(fileName: string): LanguageId | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext || ext === fileName.toLowerCase()) return null;
  return EXTENSIONS[ext] ?? null;
}

/** A pattern and the points it adds when it appears in the code. */
type Rule = [RegExp, number];

const RULES: Record<LanguageId, Rule[]> = {
  php: [
    [/<\?php/, 10],
    [/\$[a-zA-Z_]\w*\s*=/, 2],
    [/\$this->/, 3],
    [/\becho\s/, 1],
    [/\bnamespace\s+[\w\\]+;/, 2],
    [/->\w+\(/, 1],
  ],
  html: [
    [/<!doctype\s+html/i, 10],
    [/<html[\s>]/i, 8],
    [/<(div|span|body|head|section|ul|li|p|h[1-6]|script|link|meta|form|input|button|a)\b[^>]*>/i, 3],
    [/<\/\w+>/, 1],
  ],
  css: [
    [/[.#]?[a-zA-Z][\w\-.#\s>:,]*\{\s*[\w-]+\s*:\s*[^;{}]+;/, 5],
    [/@(media|keyframes|import|font-face)\b/, 4],
    [/^\s*[\w-]+\s*:\s*[^;]+;\s*$/m, 1],
    [/\b(margin|padding|display|color|background|font-size|border)\s*:/, 2],
  ],
  sql: [
    [/\bselect\b[\s\S]+?\bfrom\b/i, 6],
    [/\binsert\s+into\b/i, 6],
    [/\bcreate\s+(table|index|view|database)\b/i, 7],
    [/\bupdate\b\s+\w+\s+\bset\b/i, 6],
    [/\bdelete\s+from\b/i, 6],
    [/\b(where|group\s+by|order\s+by|inner\s+join|left\s+join)\b/i, 2],
    [/\balter\s+table\b/i, 6],
  ],
  python: [
    [/^\s*def\s+\w+\s*\(.*\)\s*(->\s*[\w\[\], .|]+)?\s*:/m, 6],
    [/^\s*(from\s+[\w.]+\s+import\s+|import\s+[\w.]+(\s+as\s+\w+)?\s*$)/m, 4],
    [/\bself\b/, 2],
    [/^\s*(elif|except|finally|with\s+.+\s+as\s+\w+)\b.*:\s*$/m, 3],
    [/\bprint\(/, 1],
    [/__name__\s*==\s*["']__main__["']/, 6],
    [/^\s*class\s+\w+(\(.*\))?\s*:/m, 5],
    [/\b(True|False|None)\b/, 2],
    [/^\s*@\w+/m, 1],
  ],
  java: [
    [/\bpublic\s+(static\s+)?(final\s+)?class\s+\w+/, 5],
    [/System\.out\.print(ln)?\(/, 6],
    [/public\s+static\s+void\s+main\s*\(/, 8],
    [/^\s*import\s+java(x)?\.[\w.*]+;/m, 7],
    [/@Override\b/, 3],
    [/\b(private|protected|public)\s+(final\s+)?[A-Z]\w*(<[\w<>, ?]+>)?\s+\w+\s*(\(|=|;)/, 2],
    [/\bnew\s+ArrayList<|\bnew\s+HashMap</, 3],
  ],
  csharp: [
    [/^\s*using\s+System[\w.]*;/m, 8],
    [/\bnamespace\s+[\w.]+\s*(\{|;)/, 4],
    [/Console\.Write(Line)?\(/, 7],
    [/\{\s*get;\s*(set|init);?\s*\}/, 7],
    [/\b(public|private|internal|protected)\s+(static\s+)?(async\s+)?(Task|void|string|int|bool)\b/, 2],
    [/\bvar\s+\w+\s*=\s*new\s/, 2],
    [/\bforeach\s*\(\s*var\b/, 3],
    [/\[(HttpGet|HttpPost|ApiController|Route)[^\]]*\]/, 6],
  ],
  typescript: [
    [/\binterface\s+\w+\s*(<[^>]+>)?\s*(extends\s+[\w, <>]+)?\{/, 6],
    [/\btype\s+\w+(<[^>]+>)?\s*=\s*[^=]/, 5],
    [/(\(|,)\s*\w+\??\s*:\s*(string|number|boolean|any|unknown|void|never|[A-Z]\w*(\[\])?)\s*(,|\)|=)/, 5],
    [/\)\s*:\s*(Promise<[^>]+>|string|number|boolean|void|[A-Z]\w*(\[\])?)\s*(\{|=>)/, 5],
    [/\bimport\s+type\b/, 6],
    [/\bas\s+(const|string|number|unknown|any|[A-Z]\w+)\b/, 3],
    [/\benum\s+\w+\s*\{/, 4],
    [/\b(readonly|private|public|protected)\s+\w+\s*[:=]/, 2],
    [/<[A-Z]\w*(,\s*[A-Z]\w*)*>\(/, 2],
  ],
  javascript: [
    [/\b(const|let|var)\s+\w+\s*=/, 3],
    [/=>/, 2],
    [/\bfunction\s*\w*\s*\(/, 3],
    [/\brequire\(["'][^"']+["']\)/, 4],
    [/\bconsole\.(log|error|warn)\(/, 3],
    [/\bimport\s+[\w{}*,\s]+\s+from\s+["']/, 3],
    [/\bexport\s+(default|const|function|class)\b/, 3],
    [/\b(document|window)\./, 3],
    [/\bawait\s/, 1],
    [/\.then\(/, 2],
    [/===|!==/, 2],
  ],
};

/** Score per language: sum of the weights of the rules found in the code. */
function scoreLanguages(code: string): Record<LanguageId, number> {
  const score = (id: LanguageId) => RULES[id].reduce((total, [regex, weight]) => total + (regex.test(code) ? weight : 0), 0);
  return recordFromKeys(LANGUAGE_IDS, score);
}

const IDS = new Set<string>(LANGUAGE_IDS);

export function isLanguageId(value: string): value is LanguageId {
  return IDS.has(value);
}

/**
 * Detects the language. A known file extension wins. Returns "plaintext" when there is not enough evidence.
 */
export function detectLanguage(code: string, fileName?: string): LanguageOrPlain {
  if (fileName) {
    const byExtension = languageFromFilename(fileName);
    if (byExtension) return byExtension;
  }
  const sample = code.slice(0, 20_000);
  if (sample.trim().length < 3) return "plaintext";

  const scores = scoreLanguages(sample);

  // TypeScript is a superset of JavaScript: JS rules also score on TS code, so TS only wins with its own evidence.
  const tsEvidence = scores.typescript;
  const best = maxBy(
    (Object.entries(scores) as [LanguageId, number][]).filter(([id]) => id !== "typescript" && id !== "javascript"),
    ([, points]) => points,
  );

  if (tsEvidence >= 5 && tsEvidence + scores.javascript / 2 >= (best?.[1] ?? 0)) return "typescript";
  const candidates: [LanguageId, number][] = [...(best ? [best] : []), ["javascript", scores.javascript]];
  const [id, points] = maxBy(candidates, ([, p]) => p)!;
  return points >= 3 ? id : "plaintext";
}

/** Display name of a language id ("Texto" for plaintext or unknown ids). */
export function languageLabel(id: string): string {
  return LANGUAGES.find((l) => l.id === id)?.label ?? "Texto";
}

/** The value of the language picker: a known id, or "auto" for anything else. */
export function chosenLanguage(value: string): LanguageId | "auto" {
  return isLanguageId(value) ? value : "auto";
}
