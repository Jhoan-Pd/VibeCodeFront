import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RevealObserver } from "@/components/motion/reveal-observer";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { messages } from "@/i18n";
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4/opsz.css";
import "./globals.css";

const t = messages.shell;

export const metadata: Metadata = {
  title: { default: t.meta.title, template: t.meta.titleTemplate },
  description: t.meta.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#16181d" },
  ],
};

// Applies the saved theme before the first paint to avoid a flash. Light by default; dark when chosen.
// The vd-js class enables the reveal-on-scroll animations (without JS the content shows normally).
const themeScript = `document.documentElement.classList.add('vd-js');try{if(localStorage.getItem('vd-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

/**
 * Root layout. It reads no cookies nor headers (the session lives in a client island), so every page
 * chooses its own rendering: static, ISR or dynamic.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans">
        <Providers>
          <RevealObserver />
          <Navbar />
          <main>{children}</main>
        </Providers>
        <footer className="mt-24 border-t py-8 text-center text-sm text-muted-foreground print:hidden">{t.footer}</footer>
      </body>
    </html>
  );
}
