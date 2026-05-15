import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/mercadopago.ts",
        "src/lib/plan-limits.ts",
        "src/app/api/subscription/**",
        "src/app/api/webhooks/**",
        "src/app/api/cron/**",
      ],
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
