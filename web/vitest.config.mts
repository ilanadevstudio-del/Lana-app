import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Run through `npm test` (scripts/vitest.mjs) so the working directory is canonical on Windows.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
