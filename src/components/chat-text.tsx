import { Fragment } from "react";
import { InlineCodeText } from "@/components/inline-code-text";

const LIST_ITEM = /^\s*([-*•]|\d+[.)])\s+/;

/**
 * A VERY small Markdown subset for chat answers: ``` code blocks, dash or numbered lists, **bold** and
 * `inline code`. Everything is built from React nodes (never innerHTML), so any HTML the LLM returns is
 * shown as text and never runs.
 */
export function ChatText({ text, animate = false }: { text: string; animate?: boolean }) {
  const parts = text.split(/```[a-zA-Z0-9+#-]*\n?([\s\S]*?)```/g);
  return (
    // `animate`: paragraphs, lists and code blocks appear one after another (new answers).
    <div className={animate ? "vd-parts space-y-2" : "space-y-2"}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
            {part.replace(/\n$/, "")}
          </pre>
        ) : (
          <Fragment key={i}>{textBlocks(part)}</Fragment>
        ),
      )}
    </div>
  );
}

function textBlocks(text: string) {
  return text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block, i) => {
      const lines = block.split("\n");
      if (!lines.every((l) => LIST_ITEM.test(l))) {
        return (
          <p key={i} className="whitespace-pre-line">
            <InlineCodeText text={block} />
          </p>
        );
      }
      const items = lines.map((l, j) => (
        <li key={j}>
          <InlineCodeText text={l.replace(LIST_ITEM, "")} />
        </li>
      ));
      return /^\s*\d/.test(lines[0]) ? (
        <ol key={i} className="list-decimal space-y-1 pl-5">
          {items}
        </ol>
      ) : (
        <ul key={i} className="list-disc space-y-1 pl-5">
          {items}
        </ul>
      );
    });
}
