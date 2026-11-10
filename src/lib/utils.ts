import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins Tailwind classes resolving conflicts (the shadcn/ui pattern). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Locale of the whole interface (dates and numbers). */
export const LOCALE = "es-CO";

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dateFormatter = new Intl.DateTimeFormat(LOCALE);
const numberFormatter = new Intl.NumberFormat(LOCALE);

const toDate = (value: Date | string) => (typeof value === "string" ? new Date(value) : value);

/** Date and time, e.g. "08 nov 2026, 10:32". One shared Intl formatter instead of one per call. */
export function formatDateTime(value: Date | string): string {
  return dateTimeFormatter.format(toDate(value));
}

/** Date only (tables and the print view). */
export function formatDate(value: Date | string): string {
  return dateFormatter.format(toDate(value));
}

/** 12000 → "12.000". */
export function formatNumber(n: number): string {
  return numberFormatter.format(n);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
