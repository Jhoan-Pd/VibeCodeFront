/**
 * Pure logic of the viewer (no Monaco, no React), unit tested.
 */

export interface LineSpan {
  start: number;
  end: number;
}

/**
 * Line → index of the block that explains it, as a dense array (position = line number). It is queried on
 * every mouse move over the editor: an array gives O(1) access without hashing and uses less memory than a
 * Map with one entry per line. -1 = line without explanation. When two blocks overlap the last one wins.
 */
export function blockIndexByLine(blocks: readonly { lineStart: number; lineEnd: number }[], lineCount: number): Int32Array {
  const index = new Int32Array(lineCount + 1).fill(-1);
  blocks.forEach((b, i) => {
    const from = Math.max(1, b.lineStart);
    const to = Math.min(lineCount, b.lineEnd);
    if (from <= to) index.fill(i, from, to + 1);
  });
  return index;
}

/** Block of a line, or null when the line has no explanation or is outside the file. */
export function blockAtLine(index: Int32Array, line: number): number | null {
  const i = line >= 0 && line < index.length ? index[line] : -1;
  return i >= 0 ? i : null;
}

/**
 * Line span of an editor selection. When the selection ends at the start of a line (column 1, typical when
 * dragging to the next row) that last line does not count.
 */
export function spanFromSelection(s: { startLineNumber: number; endLineNumber: number; endColumn: number }): LineSpan {
  const end = s.endColumn === 1 && s.endLineNumber > s.startLineNumber ? s.endLineNumber - 1 : s.endLineNumber;
  return { start: s.startLineNumber, end };
}

/** Number of lines of a text (an empty text has one line, as in the editor). */
export function countLines(text: string): number {
  let n = 1;
  for (let i = text.indexOf("\n"); i !== -1; i = text.indexOf("\n", i + 1)) n++;
  return n;
}

/**
 * Parses the "?l=3-9" (or "?l=4") query parameter into a valid span inside the file. Anything else
 * (text, inverted spans, lines outside the file) is ignored by returning null.
 */
export function spanFromParam(value: string | undefined | null, lineCount: number): LineSpan | null {
  const m = value?.match(/^(\d{1,6})(?:-(\d{1,6}))?$/);
  if (!m) return null;
  const start = Number(m[1]);
  const end = Number(m[2] ?? m[1]);
  if (start < 1 || end < start || start > lineCount) return null;
  return { start, end: Math.min(end, lineCount) };
}
