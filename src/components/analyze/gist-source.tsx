"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { languageLabel } from "@/lib/language";
import type { GistFileView } from "@/types/analysis-view";

const t = messages.analyze.gist;

/** Loads a public Gist; when it has several files, lets the person pick one. */
export function GistSource({ loading, files, onLoad, onPick }: { loading: boolean; files: GistFileView[]; onLoad: (url: string) => void; onPick: (f: GistFileView) => void }) {
  const [url, setUrl] = useState("");
  const canLoad = !loading && url.trim() !== "";

  return (
    <div className="min-h-[300px] space-y-4 p-5">
      <div className="space-y-2">
        <Label htmlFor="gist-url">{t.urlLabel}</Label>
        <div className="flex gap-2">
          <Input id="gist-url" inputMode="url" placeholder={t.placeholder} value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && canLoad && onLoad(url)} />
          <Button type="button" onClick={() => onLoad(url)} disabled={!canLoad}>
            {loading ? <Spinner /> : null} {t.load}
          </Button>
        </div>
      </div>
      {files.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t.pickFile}</p>
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.name}>
                <Button type="button" variant="outline" className="w-full justify-between" onClick={() => onPick(f)}>
                  <span className="truncate font-mono text-xs">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{languageLabel(f.language)}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
