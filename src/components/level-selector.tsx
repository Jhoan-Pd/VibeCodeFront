"use client";

import { messages } from "@/i18n";
import { cn } from "@/lib/utils";
import { LEVELS, type Level } from "@/types/analysis-view";

/** Level picker (beginner / intermediate / advanced) as an accessible radio group. */
export function LevelSelector({ value, onChange, disabled }: { value: Level; onChange: (level: Level) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label={messages.profile.levelGroup} className="grid gap-2">
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          role="radio"
          aria-checked={value === level}
          disabled={disabled}
          onClick={() => onChange(level)}
          className={cn("rounded-lg border p-3 text-left transition-colors disabled:opacity-50", value === level ? "border-primary bg-primary/10" : "hover:border-primary/40")}
        >
          <span className="text-sm font-medium">{messages.labels.level[level].label}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{messages.labels.level[level].description}</span>
        </button>
      ))}
    </div>
  );
}
