import { describe, expect, it } from "vitest";
import { DEMO_QUESTIONS, DEMO_VIEW } from "@/lib/demo/analysis";
import { escapeLine, fenceFor, fileName, toMarkdown } from "@/lib/markdown-export";
import type { AnalysisView } from "@/types/analysis-view";

const meta = { title: "Caché con TTL", level: "INTERMEDIATE" as const, createdAt: new Date("2026-10-08T12:00:00Z") };
const empty: AnalysisView = { code: "", language: "python", summary: null, blocks: [], diagrams: [], concepts: [], findings: [], quiz: null };

describe("toMarkdown", () => {
  const md = toMarkdown(DEMO_VIEW, meta);

  it("includes every section of the analysis", () => {
    for (const section of ["# Caché con TTL", "## Resumen", "## Código", "## Explicación por bloques", "## Diagramas", "## Glosario", "## Auditoría de vibe code", "## Quiz de autoevaluación"]) {
      expect(md).toContain(section);
    }
    expect(md).toContain("nivel intermedio · 2026-10-08");
  });

  it("diagrams go in mermaid blocks and every block cites its range and snippet", () => {
    expect(md.match(/```mermaid/g)?.length).toBe(DEMO_VIEW.diagrams.length);
    const b = DEMO_VIEW.blocks[0];
    expect(md).toContain(`### L${b.lineStart}${b.lineEnd === b.lineStart ? "" : `–${b.lineEnd}`}`);
    expect(md).toContain(DEMO_VIEW.code.split("\n")[b.lineStart - 1]);
  });

  it("never includes the quiz answers", () => {
    for (const q of DEMO_QUESTIONS) expect(md).not.toContain(q.explanation);
    expect(md).toContain("Las respuestas no se incluyen");
  });

  it("keeps the exact code, blank lines included", () => {
    const code = "a = 1\n\n\n\nb = 2";
    expect(toMarkdown({ ...empty, code }, meta)).toContain(code);
  });

  it("adds the public link when there is one and skips empty sections", () => {
    const out = toMarkdown({ ...empty, code: "x" }, { ...meta, link: "https://app.test/c/abc" });
    expect(out).toContain("> Enlace público: https://app.test/c/abc");
    expect(out).not.toContain("## Glosario");
    expect(out).toContain("Sin hallazgos.");
  });
});

describe("helpers", () => {
  it("the fence is longer than any backtick run in the content", () => {
    expect(fenceFor("print('hola')")).toBe("```");
    expect(fenceFor("texto ```js\nx\n```")).toBe("````");
    expect(fenceFor("````")).toBe("`````");
  });

  it("an LLM title cannot inject Markdown structure", () => {
    expect(escapeLine("# Hola\n## [link](x)")).toBe("\\# Hola \\#\\# \\[link\\](x)");
  });

  it("safe file names", () => {
    expect(fileName("Caché con TTL (v2)!", "md")).toBe("cache-con-ttl-v2.md");
    expect(fileName("···", "md")).toBe("analisis.md");
    expect(fileName("../../etc/passwd", "md")).toBe("etc-passwd.md");
  });
});
