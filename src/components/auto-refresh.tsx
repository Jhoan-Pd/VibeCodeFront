"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-renders the Server Component tree every few seconds (router.refresh keeps client state) while an
 * analysis is still being processed on the server. Stops after `maxTimes` refreshes.
 */
export function AutoRefresh({ everyMs = 4000, maxTimes = 20 }: { everyMs?: number; maxTimes?: number }) {
  const router = useRouter();
  useEffect(() => {
    let times = 0;
    const id = setInterval(() => {
      times += 1;
      router.refresh();
      if (times >= maxTimes) clearInterval(id);
    }, everyMs);
    return () => clearInterval(id);
  }, [router, everyMs, maxTimes]);
  return null;
}
