import { analysis } from "./es/analysis";
import { analyze } from "./es/analyze";
import { auth } from "./es/auth";
import { common, errors, labels } from "./es/common";
import { dashboard } from "./es/dashboard";
import { exportMarkdown } from "./es/export";
import { landing } from "./es/landing";
import { print, shared } from "./es/print";
import { profile } from "./es/profile";
import { progress } from "./es/progress";
import { shell } from "./es/shell";
import { viewer } from "./es/viewer";

/** Spanish catalogue: one namespace per area of the app. */
export const es = { common, errors, labels, auth, shell, landing, dashboard, analyze, analysis, viewer, progress, profile, print, shared, exportMarkdown } as const;
