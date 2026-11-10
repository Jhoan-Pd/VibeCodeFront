import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED_PAGES = ["/dashboard", "/progress", "/analyze", "/analysis", "/profile"];
const GUEST_ONLY_PAGES = ["/login", "/register"];

const matches = (path: string, prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

/**
 * Guards pages BEFORE rendering. It is the first barrier only: server pages ask the backend with the
 * user's token, and the backend checks it again on every RPC (defence in depth).
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const signedIn = !!req.auth;

  if (!signedIn && matches(pathname, PROTECTED_PAGES)) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  if (signedIn && matches(pathname, GUEST_ONLY_PAGES)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/progress/:path*", "/analyze/:path*", "/analysis/:path*", "/profile/:path*", "/login", "/register"],
};
