"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { rpc } from "@/lib/rpc/browser";
import { attempt } from "@/lib/rpc/errors";
import { toProtoStage } from "@/lib/rpc/mappers";
import type { Stage } from "@/types/analysis-view";

const t = messages.viewer.regenerate;

/**
 * Re-runs ONE stage of an analysis through RegenerateStage and then refreshes the Server Component
 * tree (router.refresh), so the page re-reads the analysis from the backend without a full reload.
 */
export function RegenerateStageButton({ analysisId, stage, children = t.retry, ...props }: { analysisId: string; stage: Stage } & Omit<ButtonProps, "onClick">) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    setLoading(true);
    setError(null);
    const r = await attempt(() => rpc.analysis.regenerateStage({ analysisId, stage: toProtoStage(stage) }));
    setLoading(false);
    if (r.ok) router.refresh();
    else setError(r.error || t.failed);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant="outline" size="sm" onClick={regenerate} disabled={loading} {...props}>
        {loading ? <Spinner /> : <RefreshCw />}
        {loading ? t.generating : children}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
