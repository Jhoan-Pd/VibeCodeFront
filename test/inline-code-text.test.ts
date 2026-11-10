import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InlineCodeText } from "@/components/inline-code-text";

const html = (text: string) => renderToStaticMarkup(createElement(InlineCodeText, { text }));

describe("InlineCodeText", () => {
  it("renders `code` and **bold**", () => {
    const h = html("Usa **backoff exponencial** con `setTimeout`.");
    expect(h).toContain("<strong");
    expect(h).toContain(">backoff exponencial</strong>");
    expect(h).toMatch(/<code[^>]*>setTimeout<\/code>/);
    expect(h).not.toContain("**");
  });

  it("asterisks inside code are not bold", () => {
    const h = html("La espera es `500 * 2 ** i` y crece **rápido**.");
    expect(h).toMatch(/<code[^>]*>500 \* 2 \*\* i<\/code>/);
    expect(h).toContain(">rápido</strong>");
  });

  it("accepts code inside bold", () => {
    expect(html("**`fetch`** puede fallar")).toMatch(/<strong[^>]*><code[^>]*>fetch<\/code><\/strong>/);
  });

  it("escapes HTML coming from the LLM", () => {
    const h = html("<img src=x onerror=alert(1)> **<b>x</b>**");
    expect(h).not.toContain("<img");
    expect(h).toContain("&lt;img");
    expect(h).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("leaves lone asterisks alone", () => {
    expect(html("a * b y c ** d")).toBe("a * b y c ** d");
  });
});
