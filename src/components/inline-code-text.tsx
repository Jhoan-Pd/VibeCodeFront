import { Fragment, type ReactNode } from "react";

/** Internal marker protecting code spans while bold is parsed (never appears in normal text). */
const MARK = "\u0000";

/**
 * Minimal formatting for the text the LLM returns: `code` becomes <code> and **bold** becomes <strong>.
 * Rendered with React nodes (never innerHTML), so everything coming from the LLM is escaped: there is
 * no HTML injection path.
 */
export function InlineCodeText({ text }: { text: string }) {
  return <>{format(text.replaceAll(MARK, ""))}</>;
}

/**
 * Code is set aside first (so `2 ** i` is not mistaken for bold) and then bold is applied, which may
 * contain code: **`fetch`** works too.
 */
function format(text: string): ReactNode[] {
  const snippets: string[] = [];
  const protectedText = text.replace(/`([^`]+)`/g, (_, c: string) => `${MARK}${snippets.push(c) - 1}${MARK}`);

  const withCode = (fragment: string, key: string): ReactNode[] =>
    fragment.split(new RegExp(`${MARK}(\\d+)${MARK}`, "g")).map((p, i) =>
      i % 2 === 1 ? (
        <code key={`${key}-${i}`} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-accent">
          {snippets[Number(p)]}
        </code>
      ) : (
        <Fragment key={`${key}-${i}`}>{p}</Fragment>
      ),
    );

  return protectedText.split(/\*\*([^*\n]+)\*\*/g).map((p, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {withCode(p, `b${i}`)}
      </strong>
    ) : (
      <Fragment key={i}>{withCode(p, `t${i}`)}</Fragment>
    ),
  );
}
