import type { Severity } from "@/types/analysis-view";

/** Severities from the most to the least serious (display order). */
export const SEVERITY_ORDER: readonly Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

/** Badge variant of each severity (the label itself comes from the message catalogue). */
export const SEVERITY_BADGE: Record<Severity, "destructive" | "warning" | "secondary"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};
