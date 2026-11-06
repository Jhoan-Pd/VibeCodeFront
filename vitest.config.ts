import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Components use the automatic JSX runtime (like Next.js), without `import React`.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
});
