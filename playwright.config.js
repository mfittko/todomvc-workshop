import { defineConfig, devices } from "@playwright/test";

// Each test gets a fresh browser context (Playwright default), so localStorage starts empty.
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://127.0.0.1:5173" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
});
