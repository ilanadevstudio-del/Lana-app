import type { ActionStatus } from "@/lib/data/types";

/** Outcomes the user should look at: failures, partial runs and anything not confirmed. */
export const NEEDS_REVIEW: ActionStatus[] = ["failed", "partially_completed", "unverified"];

export const HISTORY_STATUSES: ActionStatus[] = ["succeeded", "unverified", "partially_completed", "failed", "cancelled", "executing"];
