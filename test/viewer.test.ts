import { describe, expect, it } from "vitest";
import { blockAtLine, blockIndexByLine, countLines, spanFromParam, spanFromSelection } from "@/lib/viewer";

describe("viewer", () => {
  it("blockIndexByLine maps each line to its block and -1 to the rest", () => {
    const idx = blockIndexByLine([{ lineStart: 1, lineEnd: 2 }, { lineStart: 4, lineEnd: 6 }], 7);
    expect([1, 2, 3, 4, 6, 7].map((l) => blockAtLine(idx, l))).toEqual([0, 0, null, 1, 1, null]);
    expect(blockAtLine(idx, 0)).toBeNull();
    expect(blockAtLine(idx, 99)).toBeNull();
  });

  it("on overlaps the last block wins, and ranges are clipped to the file", () => {
    const idx = blockIndexByLine([{ lineStart: 1, lineEnd: 5 }, { lineStart: 3, lineEnd: 40 }], 4);
    expect([1, 2, 3, 4].map((l) => blockAtLine(idx, l))).toEqual([0, 0, 1, 1]);
  });

  it("spanFromSelection drops the last line when the selection ends at its column 1", () => {
    expect(spanFromSelection({ startLineNumber: 3, endLineNumber: 6, endColumn: 1 })).toEqual({ start: 3, end: 5 });
    expect(spanFromSelection({ startLineNumber: 3, endLineNumber: 6, endColumn: 4 })).toEqual({ start: 3, end: 6 });
    expect(spanFromSelection({ startLineNumber: 3, endLineNumber: 3, endColumn: 1 })).toEqual({ start: 3, end: 3 });
  });

  it("countLines matches split", () => {
    for (const t of ["", "a", "a\nb", "a\n", "\n\n\n"]) expect(countLines(t)).toBe(t.split("\n").length);
  });

  it("spanFromParam accepts ?l=3-9 and ?l=4 inside the file and ignores the rest", () => {
    expect(spanFromParam("3-9", 20)).toEqual({ start: 3, end: 9 });
    expect(spanFromParam("4", 20)).toEqual({ start: 4, end: 4 });
    expect(spanFromParam("18-40", 20)).toEqual({ start: 18, end: 20 });
    for (const bad of [undefined, "", "x", "9-3", "0", "21", "1-2-3"]) expect(spanFromParam(bad, 20)).toBeNull();
  });
});
