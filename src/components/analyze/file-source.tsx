"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n";
import { cn } from "@/lib/utils";

const ACCEPTED = ".js,.jsx,.mjs,.cjs,.ts,.tsx,.py,.java,.cs,.php,.sql,.html,.htm,.css,.txt";
const t = messages.analyze.file;

/** Drop zone (or picker) for a code file. */
export function FileSource({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="p-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={cn(
          "flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <Upload className="size-8 text-muted-foreground" />
        <p className="text-sm">{t.drop}</p>
        <p className="text-xs text-muted-foreground">{t.supported}</p>
        <Button type="button" variant="outline" onClick={() => input.current?.click()}>
          {t.choose}
        </Button>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          aria-label={t.inputLabel}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
