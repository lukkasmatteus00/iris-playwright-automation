import { rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Page, Download } from "@playwright/test";
import { expect } from "@playwright/test";

export const DOWNLOADS_DIR = join(process.cwd(), "test-results", "downloads");

export async function clearDownloadsDir(): Promise<void> {
  if (existsSync(DOWNLOADS_DIR)) {
    await rm(DOWNLOADS_DIR, { recursive: true, force: true });
  }
  await mkdir(DOWNLOADS_DIR, { recursive: true });
}

export class ReportPage {
  constructor(private readonly page: Page) {}

  get heading() {
    return this.page.getByRole("heading", { level: 2, name: "Reports / Export" });
  }

  get subtitle() {
    return this.page.locator("p", {
      hasText: "Export the current quarter's observation reports.",
    });
  }

  async assertPageContent(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.subtitle).toBeVisible();
  }

  async exportCsv(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.getByRole("button", { name: "Export CSV" }).click(),
    ]);
    return download;
  }

  async assertCsvDownload(download: Download): Promise<void> {
    expect(download.suggestedFilename()).toBe("observation-reports.csv");
    const path = await download.path();
    expect(path).not.toBeNull();
  }
}
