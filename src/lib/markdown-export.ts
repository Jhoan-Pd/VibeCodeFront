import { messages } from "@/i18n";
import { languageLabel } from "@/lib/language";
import type { AnalysisView, Level } from "@/types/analysis-view";

/**
 * Markdown export (pure function, unit tested).
 * The quiz is exported WITHOUT answers: it is for self-assessment and never leaks the grading key.
 */

export interface ExportMeta {
  title: string;
  level: Level;
  createdAt: Date;
  /** Public URL when the analysis is shared. */
  link?: string | null;
}

/** Fence that does not clash with backticks inside the content (```` when the code uses ```). */
export function fenceFor(content: string): string {
  const longest = Math.max(2, ...[...content.matchAll(/`{3,}/g)].map((m) => m[0].length));
  return "`".repeat(longest + 1);
}

/** Keeps a title with "#", "*" or "[" from the LLM from breaking the document structure. */
export function escapeLine(text: string): string {
  return text.replace(/\r?\n+/g, " ").replace(/([\\`*_[\]#<>|])/g, "\\$1").trim();
}

const oneLine = (text: string) => text.replace(/\r?\n+/g, " ");
const range = (start: number | null, end: number | null) => (start == null ? "" : messages.common.lineRange(start, end));

/** ASCII slug of the title (accents removed) plus the extension. */
export function fileName(title: string, extension: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || messages.exportMarkdown.defaultFileName}.${extension}`;
}

export function toMarkdown(view: AnalysisView, meta: ExportMeta): string {
  const t = messages.exportMarkdown;
  const { labels } = messages;
  const lines = view.code.split("\n");
  const lang = view.language === "plaintext" ? "" : view.language;
  const out: string[] = [];

  out.push(`# ${escapeLine(meta.title)}`, "");
  out.push(`> ${t.generatedWith(languageLabel(view.language), labels.level[meta.level].label.toLowerCase(), meta.createdAt.toISOString().slice(0, 10))}`);
  if (meta.link) out.push(`> ${t.publicLink}: ${meta.link}`);
  out.push("");

  if (view.summary) {
    const s = view.summary;
    out.push(`## ${t.summary}`, "", s.purpose, "");
    const list = (heading: string, items: string[]) => {
      if (items.length > 0) out.push(`**${heading}**`, "", ...items.map((i) => `- ${i}`), "");
    };
    list(t.inputs, s.inputs);
    list(t.outputs, s.outputs);
    list(t.dependencies, s.dependencies);
  }

  const fence = fenceFor(view.code);
  out.push(`## ${t.code}`, "", `${fence}${lang}`, view.code, fence, "");

  if (view.blocks.length > 0) {
    out.push(`## ${t.blocks}`, "");
    for (const b of view.blocks) {
      const snippet = lines.slice(b.lineStart - 1, b.lineEnd).join("\n");
      const f = fenceFor(snippet);
      out.push(`### ${range(b.lineStart, b.lineEnd)} · ${escapeLine(b.title)}`, "", `${f}${lang}`, snippet, f, "", b.explanation, "");
    }
  }

  if (view.diagrams.length > 0) {
    out.push(`## ${t.diagrams}`, "");
    for (const d of view.diagrams) out.push(`### ${labels.diagramKind[d.kind]}: ${escapeLine(d.title)}`, "", "```mermaid", d.mermaid, "```", "");
  }

  if (view.concepts.length > 0) {
    out.push(`## ${t.glossary}`, "");
    for (const c of view.concepts) {
      const r = range(c.lineStart, c.lineEnd);
      out.push(`- **${escapeLine(c.name)}**${r ? ` (${r})` : ""}: ${oneLine(c.explanation)}`);
    }
    out.push("");
  }

  out.push(`## ${t.audit}`, "");
  if (view.findings.length === 0) out.push(t.noFindings, "");
  for (const f of view.findings) {
    const r = range(f.lineStart, f.lineEnd);
    out.push(
      `### [${labels.severity[f.severity]}] ${escapeLine(f.title)}`,
      "",
      `*${labels.findingKind[f.kind]}${r ? ` · ${r}` : ""}*`,
      "",
      f.description,
      "",
      `**${t.suggestion}:** ${f.suggestion}`,
      "",
    );
  }

  if (view.quiz && view.quiz.questions.length > 0) {
    out.push(`## ${t.quiz}`, "", t.quizNoAnswers, "");
    view.quiz.questions.forEach((q, i) => {
      out.push(`${i + 1}. **${labels.questionKind[q.kind]}** — ${oneLine(q.prompt)}`);
      if (q.kind === "TRUE_FALSE") out.push(`   - ${labels.trueFalse.true}`, `   - ${labels.trueFalse.false}`);
      else for (const o of q.options ?? []) out.push(`   - ${oneLine(o)}`);
    });
    out.push("");
  }

  return out.join("\n").trimEnd() + "\n";
}
