"use client";

import dynamic from "next/dynamic";
import type { EditorProps } from "@monaco-editor/react";
import { Skeleton } from "@/components/ui/misc";
import { messages } from "@/i18n";

/**
 * Monaco loads only in the browser (it uses `window`) and lazily, so it stays out of the initial bundle.
 * The editor files are served from /monaco/vs (see scripts/copy-monaco.mjs).
 */
export const MonacoEditor = dynamic<EditorProps>(
  () =>
    import("@monaco-editor/react").then((m) => {
      // Served from /public/monaco (copied on postinstall): no CDN, works on restricted networks.
      // The URL must be ABSOLUTE: Monaco's web workers are created from a blob: and cannot resolve relative paths.
      m.loader.config({ paths: { vs: `${window.location.origin}/monaco/vs` } });
      return m.default;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col gap-2 p-4" aria-label={messages.viewer.loadingEditor}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${40 + ((i * 17) % 50)}%` }} />
        ))}
      </div>
    ),
  },
);

/** Shared options of the viewer's read-only editor. */
export const VIEWER_OPTIONS: NonNullable<EditorProps["options"]> = {
  readOnly: true,
  domReadOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 13,
  lineHeight: 21,
  lineNumbers: "on",
  renderLineHighlight: "none",
  glyphMargin: false,
  folding: false,
  lineDecorationsWidth: 12,
  lineNumbersMinChars: 3,
  wordWrap: "on",
  padding: { top: 10, bottom: 10 },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  automaticLayout: true,
  contextmenu: false,
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
};

/** Options of the editable editor (new analysis screen). */
export const EDITOR_OPTIONS: NonNullable<EditorProps["options"]> = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 13,
  lineHeight: 21,
  wordWrap: "on",
  padding: { top: 10, bottom: 10 },
  automaticLayout: true,
  tabSize: 2,
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
};
