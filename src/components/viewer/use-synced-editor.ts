"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Monaco } from "@monaco-editor/react";
import type { editor as MonacoNS } from "monaco-editor";
import { blockAtLine, blockIndexByLine, spanFromSelection, type LineSpan } from "@/lib/viewer";
import type { Block } from "@/types/analysis-view";

/** Who activated the block: decides whether the editor scrolls (from the panel) or the panel does (from the editor). */
type Source = "panel" | "editor";
type Focus = LineSpan & { n: number };

const ACTIVE_DECORATION = { isWholeLine: true, className: "vd-hl-line", linesDecorationsClassName: "vd-hl-gutter" };
const BLOCK_DECORATION = { linesDecorationsClassName: "vd-has-explanation" };
const FOCUS_DECORATION = { isWholeLine: true, className: "vd-focus-line", linesDecorationsClassName: "vd-focus-gutter" };

/**
 * Keeps Monaco and the explanations panel in sync (an observer in both directions):
 *  - editor → panel: hovering a line activates its block; selecting lines sets the chat context;
 *  - panel → editor: the active block and the "focus" (from the glossary, audit or quiz) are painted as decorations.
 * Everything that touches refs and Monaco instances lives here; the component only gets state and callbacks.
 */
export function useSyncedEditor({
  blocks,
  lineCount,
  initialFocus,
  onGoToLines,
}: {
  blocks: Block[];
  lineCount: number;
  initialFocus: LineSpan | null;
  /** Called before highlighting a range (e.g. to switch to the code tab). */
  onGoToLines: () => void;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [focus, setFocus] = useState<Focus | null>(initialFocus ? { ...initialFocus, n: 0 } : null);
  const [selection, setSelection] = useState<LineSpan | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  const editorRef = useRef<MonacoNS.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<MonacoNS.IEditorDecorationsCollection | null>(null);
  const sourceRef = useRef<Source>("panel");
  const activeRef = useRef<number | null>(null);
  /** Panel items, to scroll the panel to the active block. */
  const itemsRef = useRef<(HTMLElement | null)[]>([]);
  /** The code container, brought into view when a range is focused. */
  const containerRef = useRef<HTMLDivElement | null>(null);

  const index = useMemo(() => blockIndexByLine(blocks, lineCount), [blocks, lineCount]);
  // Monaco listeners are registered once: they read the current index through a ref.
  const indexRef = useRef(index);
  indexRef.current = index;

  const activate = useCallback((i: number, source: Source) => {
    if (activeRef.current === i) return;
    sourceRef.current = source;
    activeRef.current = i;
    setActive(i);
    setFocus(null);
  }, []);

  const goToLines = useCallback(
    (start: number, end: number) => {
      onGoToLines();
      // `n` changes on every click so the effect runs again even for the same range.
      setFocus((prev) => ({ start, end, n: (prev?.n ?? 0) + 1 }));
    },
    [onGoToLines],
  );

  const onMount = useCallback(
    (editor: MonacoNS.IStandaloneCodeEditor, monaco: Monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      decorationsRef.current = editor.createDecorationsCollection([]);
      editor.onDidChangeCursorSelection(({ selection: s }) => {
        if (!s.isEmpty()) setSelection(spanFromSelection(s));
      });
      editor.onMouseMove((e) => {
        const line = e.target.position?.lineNumber;
        const i = line ? blockAtLine(indexRef.current, line) : null;
        if (i !== null) activate(i, "editor");
      });
      setEditorReady(true);
    },
    [activate],
  );

  // Panel → editor: paints the marks of every block, the active one and the focus, and scrolls what is needed.
  useEffect(() => {
    const monaco = monacoRef.current;
    const collection = decorationsRef.current;
    if (!editorReady || !monaco || !collection) return;

    const marks: MonacoNS.IModelDeltaDecoration[] = blocks.map((b, i) => ({
      range: new monaco.Range(b.lineStart, 1, b.lineEnd, 1),
      options: i === active && !focus ? ACTIVE_DECORATION : BLOCK_DECORATION,
    }));
    if (focus) marks.push({ range: new monaco.Range(focus.start, 1, focus.end, 1), options: FOCUS_DECORATION });
    collection.set(marks);

    if (focus) {
      // The editor tab was just shown: wait a frame so Monaco recomputes its size.
      const t = setTimeout(() => {
        editorRef.current?.layout();
        editorRef.current?.revealLinesInCenter(focus.start, focus.end);
        containerRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      }, 60);
      return () => clearTimeout(t);
    }

    if (active !== null) {
      const b = blocks[active];
      if (sourceRef.current === "panel") editorRef.current?.revealLinesInCenterIfOutsideViewport(b.lineStart, b.lineEnd);
      else itemsRef.current[active]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [active, blocks, editorReady, focus]);

  return { active, activate, goToLines, selection, setSelection, onMount, itemsRef, containerRef };
}
