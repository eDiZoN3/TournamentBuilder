import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts", "./__tests__/setup/db.ts"],
    passWithNoTests: true,
    hookTimeout: 60000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "**/node_modules/**",
        "**/.next/**",
        "**/coverage/**",
        "**/__tests__/**",
        "**/*.config.*",
        "**/*.d.ts",
        "vitest.setup.ts",
        "scripts/**",
        // NextAuth handler re-export — no logic of our own to cover.
        // (bracketed segment is glob syntax, so match the dir instead.)
        "**/api/auth/**",
      ],
    },
  },
});
