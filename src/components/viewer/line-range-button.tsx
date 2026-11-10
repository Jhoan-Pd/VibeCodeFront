"use client";

import { Code2 } from "lucide-react";
import { messages } from "@/i18n";

export type GoToLines = (start: number, end: number) => void;

export const lineRangeLabel = (start: number, end: number | null) => messages.common.lineRange(start, end);

/** Button that jumps to the editor and highlights a line range. Renders nothing without a range. */
export function LineRangeButton({ start, end, goToLines, text }: { start: number | null; end: number | null; goToLines?: GoToLines; text?: string }) {
  if (start == null) return null;
  const label = lineRangeLabel(start, end);
  if (!goToLines) return <span className="font-mono text-xs text-muted-foreground">{label}</span>;
  return (
    <button
      type="button"
      onClick={() => goToLines(start, end ?? start)}
      className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={messages.viewer.lineButton.ariaLabel(text ?? messages.viewer.lineButton.viewInCode, label.slice(1))}
    >
      <Code2 className="size-3" /> {text ? `${text} ${label}` : label}
    </button>
  );
}
