import { RegenerateStageButton } from "@/components/regenerate-stage-button";
import { Card, CardContent } from "@/components/ui/card";
import type { Stage } from "@/types/analysis-view";

/** Empty state shared by the panels: what is missing and, on the owner's analysis, a button to generate it. */
export function MissingStage({ message, stage, action, analysisId }: { message: string; stage: Stage; action: string; analysisId?: string }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
        <p>{message}</p>
        {analysisId && (
          <RegenerateStageButton analysisId={analysisId} stage={stage}>
            {action}
          </RegenerateStageButton>
        )}
      </CardContent>
    </Card>
  );
}
