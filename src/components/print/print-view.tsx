import { InlineCodeText } from "@/components/inline-code-text";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { messages } from "@/i18n";
import { languageLabel } from "@/lib/language";
import { formatDate } from "@/lib/utils";
import type { AnalysisView, Level } from "@/types/analysis-view";

const t = messages.exportMarkdown;
const { labels } = messages;
const range = (start: number | null, end: number | null) => (start == null ? null : messages.common.lineRange(start, end));

/** Code with line numbers (one row per line; rows never split across pages). */
function NumberedCode({ code, from = 1 }: { code: string; from?: number }) {
  const lines = code.split("\n");
  const width = String(from + lines.length - 1).length;
  return (
    <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-[11px] leading-[1.55] print:overflow-visible print:whitespace-pre-wrap">
      {lines.map((line, i) => (
        <div key={i} className="flex break-inside-avoid">
          <span className="mr-3 shrink-0 select-none text-right text-muted-foreground" style={{ width: `${width}ch` }}>
            {from + i}
          </span>
          <span className="whitespace-pre-wrap break-all">{line || " "}</span>
        </div>
      ))}
    </pre>
  );
}

function Section({ title, children, newPage = false }: { title: string; children: React.ReactNode; newPage?: boolean }) {
  return (
    <section className={newPage ? "space-y-3 print:break-before-page" : "space-y-3"}>
      <h2 className="border-b pb-1 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Printable document of the analysis (for "Save as PDF"). No Monaco nor tabs: all the content in reading
 * order. The quiz goes without answers, as in the Markdown export. A Server Component: only the diagrams
 * hydrate (Mermaid draws in the browser).
 */
export function PrintView({ view, title, level, createdAt }: { view: AnalysisView; title: string; level: Level; createdAt: string }) {
  const lines = view.code.split("\n");
  return (
    <article className="mx-auto max-w-4xl space-y-8 text-sm leading-relaxed">
      <header className="space-y-1">
        <h1 className="vd-title text-3xl">{title}</h1>
        <p className="text-muted-foreground">{messages.print.subtitle(languageLabel(view.language), labels.level[level].label, formatDate(createdAt))}</p>
      </header>

      {view.summary && (
        <Section title={t.summary}>
          <p>
            <InlineCodeText text={view.summary.purpose} />
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                [t.inputs, view.summary.inputs],
                [t.outputs, view.summary.outputs],
                [t.dependencies, view.summary.dependencies],
              ] as const
            ).map(([heading, items]) => (
              <div key={heading}>
                <p className="font-medium">{heading}</p>
                {items.length === 0 ? (
                  <p className="text-muted-foreground">{messages.viewer.summary.none}</p>
                ) : (
                  <ul className="list-disc pl-5">
                    {items.map((item) => (
                      <li key={item}>
                        <InlineCodeText text={item} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title={t.code}>
        <NumberedCode code={view.code} />
      </Section>

      {view.blocks.length > 0 && (
        <Section title={t.blocks}>
          <div className="space-y-5">
            {view.blocks.map((b, i) => (
              <div key={i} className="space-y-2">
                <h3 className="font-semibold">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{range(b.lineStart, b.lineEnd)}</span>
                  {b.title}
                </h3>
                <NumberedCode code={lines.slice(b.lineStart - 1, b.lineEnd).join("\n")} from={b.lineStart} />
                <p>
                  <InlineCodeText text={b.explanation} />
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {view.diagrams.length > 0 && (
        <Section title={t.diagrams} newPage>
          {view.diagrams.map((d) => (
            <div key={d.kind} className="break-inside-avoid space-y-2">
              <h3 className="font-semibold">
                {labels.diagramKind[d.kind]}: {d.title}
              </h3>
              <MermaidDiagram source={d.mermaid} kind={d.kind} />
            </div>
          ))}
        </Section>
      )}

      {view.concepts.length > 0 && (
        <Section title={t.glossary}>
          <dl className="space-y-2">
            {view.concepts.map((c) => (
              <div key={c.name} className="break-inside-avoid">
                <dt className="font-semibold">
                  {c.name} {range(c.lineStart, c.lineEnd) && <span className="font-mono text-xs font-normal text-muted-foreground">({range(c.lineStart, c.lineEnd)})</span>}
                </dt>
                <dd>
                  <InlineCodeText text={c.explanation} />
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      <Section title={t.audit}>
        {view.findings.length === 0 ? (
          <p className="text-muted-foreground">{t.noFindings}</p>
        ) : (
          <div className="space-y-3">
            {view.findings.map((f, i) => (
              <div key={i} className="break-inside-avoid rounded-md border p-3">
                <p className="font-semibold">
                  [{labels.severity[f.severity]}] {f.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {labels.findingKind[f.kind]}
                  {range(f.lineStart, f.lineEnd) && ` · ${range(f.lineStart, f.lineEnd)}`}
                </p>
                <p className="mt-1">
                  <InlineCodeText text={f.description} />
                </p>
                <p className="mt-1">
                  <strong>{t.suggestion}:</strong> <InlineCodeText text={f.suggestion} />
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {view.quiz && view.quiz.questions.length > 0 && (
        <Section title={t.quiz} newPage>
          <p className="text-muted-foreground">{t.quizNoAnswers.replaceAll("_", "")}</p>
          <ol className="list-decimal space-y-3 pl-5">
            {view.quiz.questions.map((q) => (
              <li key={q.id} className="break-inside-avoid">
                <p>
                  <span className="text-xs text-muted-foreground">{labels.questionKind[q.kind]} · </span>
                  <InlineCodeText text={q.prompt} />
                </p>
                <ul className="mt-1 list-[circle] pl-5">
                  {(q.kind === "TRUE_FALSE" ? [labels.trueFalse.true, labels.trueFalse.false] : (q.options ?? [])).map((o) => (
                    <li key={o}>
                      <InlineCodeText text={o} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </article>
  );
}
