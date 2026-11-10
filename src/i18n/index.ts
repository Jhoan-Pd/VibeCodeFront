import { es } from "./es";

/**
 * Every text the person reads. Code never hard-codes user-facing Spanish: components import
 * `messages` and pick their namespace, so wording is reviewed (and could be translated) in one place.
 */
export const messages = es;
export type Messages = typeof es;
