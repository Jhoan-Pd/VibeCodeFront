import { messages } from "@/i18n";

/**
 * E-mail validation with messages that say WHAT is wrong (pure function, same rules as the backend).
 * Gmail, Outlook and almost every provider reject accents, "ñ" and spaces in the address, so the form
 * warns about them instead of showing a generic "invalid e-mail".
 */

const FORMAT = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

/** The problem with the e-mail in plain language, or null when it is valid. */
export function emailProblem(value: string): string | null {
  const t = messages.auth.email;
  const email = value.trim();
  if (!email) return t.required;
  if (/\s/.test(email)) return t.spaces;

  const nonAscii = [...new Set([...email].filter((c) => c.charCodeAt(0) > 127))];
  if (nonAscii.length > 0) {
    const chars = nonAscii.map((c) => `«${c}»`).join(", ");
    const suggestion = email.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ñ/gi, "n");
    return t.nonAscii(chars, suggestion);
  }

  const atSigns = email.split("@").length - 1;
  if (atSigns === 0) return t.missingAt;
  if (atSigns > 1) return t.multipleAt;
  const [localPart, domain] = email.split("@");
  if (!localPart) return t.missingLocalPart;
  if (!domain || !domain.includes(".")) return t.missingDomain;
  if (email.length > 200) return t.tooLong;
  if (!FORMAT.test(email)) return t.invalid;
  return null;
}
