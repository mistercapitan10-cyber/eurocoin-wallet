import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
