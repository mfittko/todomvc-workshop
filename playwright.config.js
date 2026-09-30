import { defineConfig, devices } from "@playwright/test";

// E2E_PORT lets runs avoid a dev server that already holds the default port.
const port = process.env.E2E_PORT || "5173";
const baseURL = `http://127.0.0.1:${port}`;

// Each test gets a fresh browser context (Playwright default), so localStorage starts empty.
export default defineConfig({
  testDir: "e2e",
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: true,
  },
});
