"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Reveals every element with the `data-reveal` attribute when it scrolls into view (the style lives in
 * globals.css). Mounted once in the layout; it looks for elements again on every route change and
 * watches the ones added later. Without IntersectionObserver everything is shown right away.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                entry.target.classList.add("vd-visible");
                observer?.unobserve(entry.target);
              }
            },
            { threshold: 0, rootMargin: "0px 0px -24px 0px" },
          )
        : null;

    const watch = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>("[data-reveal]:not(.vd-visible)").forEach((el) => {
        if (observer) observer.observe(el);
        else el.classList.add("vd-visible");
      });
    };
    watch(document);

    // Elements rendered later (client-loaded content) are watched too, so they never stay hidden.
    const mutations = new MutationObserver((changes) => {
      for (const c of changes) c.addedNodes.forEach((n) => n instanceof HTMLElement && (n.matches("[data-reveal]") ? watch(n.parentElement ?? document) : watch(n)));
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}
