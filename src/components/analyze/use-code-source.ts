"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { publicConfig } from "@/config/public";
import { messages } from "@/i18n";
import { detectLanguage, type LanguageId } from "@/lib/language";
import { rpc } from "@/lib/rpc/browser";
import { attempt } from "@/lib/rpc/errors";
import { formatNumber } from "@/lib/utils";
import type { GistFileView } from "@/types/analysis-view";

export type SourceKind = "paste" | "file" | "gist";

const t = messages.analyze;

/**
 * Where the code comes from (editor, file or Gist) and the detected language. Detection runs on a
 * deferred value so long texts never block typing in the editor.
 */
export function useCodeSource() {
  const [source, setSource] = useState<SourceKind>("paste");
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();
  const [language, setLanguage] = useState<LanguageId | "auto">("auto");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [gistLoading, setGistLoading] = useState(false);
  const [gistFiles, setGistFiles] = useState<GistFileView[]>([]);

  const deferredCode = useDeferredValue(code);
  const detected = useMemo(() => detectLanguage(deferredCode, fileName), [deferredCode, fileName]);

  function loadCode(text: string, name?: string) {
    setCode(text);
    setFileName(name);
    if (name && !title) setTitle(name);
    setLanguage("auto");
    setSource("paste");
  }

  function edit(text: string) {
    setCode(text);
    if (!text) setFileName(undefined);
  }

  async function readFile(file: File) {
    setError(null);
    // A character takes up to 4 bytes in UTF-8: above that it surely exceeds the maximum.
    if (file.size > publicConfig.maxCodeChars * 4) {
      setError(t.file.tooBig(formatNumber(publicConfig.maxCodeChars)));
      return;
    }
    const text = await file.text();
    if (text.includes("\u0000")) {
      setError(t.file.binary);
      return;
    }
    loadCode(text, file.name);
  }

  /** ImportGist runs on the backend (only gist.github.com, anti-SSRF); the browser just asks for it. */
  async function loadGist(url: string) {
    setError(null);
    setGistFiles([]);
    setGistLoading(true);
    const r = await attempt(() => rpc.gist.importGist({ url: url.trim() }));
    setGistLoading(false);
    if (!r.ok) {
      setError(r.error || t.gist.failed);
      return;
    }
    const files = r.data.files.map((f) => ({ name: f.name, language: f.language, content: f.content }));
    if (files.length === 1) loadCode(files[0].content, files[0].name);
    else setGistFiles(files);
  }

  return {
    source,
    setSource,
    code,
    edit,
    loadCode,
    language,
    setLanguage,
    detected,
    effectiveLanguage: language === "auto" ? detected : language,
    title,
    setTitle,
    error,
    readFile,
    loadGist,
    gistLoading,
    gistFiles,
  };
}
