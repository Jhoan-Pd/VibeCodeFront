"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsDark } from "@/hooks/use-is-dark";
import { messages } from "@/i18n";

export function ThemeToggle() {
  const dark = useIsDark();

  function toggle() {
    const nextDark = !dark;
    document.documentElement.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem("vd-theme", nextDark ? "dark" : "light");
    } catch {
      /* storage unavailable: the change lasts for this visit only */
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? messages.shell.theme.toLight : messages.shell.theme.toDark}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
