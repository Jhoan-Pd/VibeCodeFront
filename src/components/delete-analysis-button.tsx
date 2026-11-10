"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { messages } from "@/i18n";
import { rpc } from "@/lib/rpc/browser";
import { attempt } from "@/lib/rpc/errors";

const t = messages.dashboard.delete;

/** Two-step delete (ask, then confirm inline) through DeleteAnalysis. */
export function DeleteAnalysisButton({ id, redirectTo }: { id: string; redirectTo?: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setLoading(true);
    setError(null);
    const r = await attempt(() => rpc.analysis.deleteAnalysis({ analysisId: id }));
    setLoading(false);
    setConfirming(false);
    if (!r.ok) {
      setError(r.error || t.failed);
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  if (!confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        {error && (
          <span role="alert" className="text-xs text-destructive">
            {error}
          </span>
        )}
        <Button variant="ghost" size="icon" aria-label={t.label} onClick={() => setConfirming(true)}>
          <Trash2 />
        </Button>
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Button variant="destructive" size="sm" onClick={remove} disabled={loading}>
        {loading && <Spinner />} {t.confirm}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={loading}>
        {messages.common.cancel}
      </Button>
    </div>
  );
}
