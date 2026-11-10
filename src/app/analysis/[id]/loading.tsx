import { Skeleton } from "@/components/ui/misc";
import { messages } from "@/i18n";

/** Route-level streaming: shown instantly on navigation while the server fetches the analysis. */
export default function LoadingAnalysis() {
  return (
    <div className="container space-y-6 py-8" aria-busy="true" aria-label={messages.analysis.loading}>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-40" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[50vh]" />
        <Skeleton className="h-[50vh]" />
      </div>
    </div>
  );
}
