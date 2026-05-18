import { defineConfig, devices } from "@playwright/test";
import { apiEnv, frontendBaseUrl } from "@support/config/env.js";

const env = apiEnv();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: frontendBaseUrl(),
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "api",
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        baseURL: env.backendBaseUrl,
        trace: "off"
      }
    },
    {
      name: "chromium",
      testMatch: /.*\.e2e\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: frontendBaseUrl(),
        trace: "off"
      }
    }
  ]
});
