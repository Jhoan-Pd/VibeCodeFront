"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Client-side session for the navbar and the other client islands. The root layout never calls auth(),
 * so it does not read cookies and static pages (the landing) stay statically generated.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>;
}
