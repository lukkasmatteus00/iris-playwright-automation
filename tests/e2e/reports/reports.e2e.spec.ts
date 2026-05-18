import { readFile } from "node:fs/promises";

import { test, expect } from "@playwright/test";

import {
  assertStaffLoginPageContent,
  fillAndSubmitStaffLoginForm,
  navigateAndOpenStaffLogin
} from "@support/ui/common.steps.js";

import { clickMenuItem } from "@support/ui/pages/sidebar-menu.js";
import { ReportPage, clearDownloadsDir } from "@support/ui/pages/report.page.js";
import { apiEnv, testEnv } from "@support/config/env.js";

test.describe("Download Reports E2E", () => {
  test.use({ acceptDownloads: true });

  test.beforeEach(async () => {
    await clearDownloadsDir();
  });

  test("should export a CSV report successfully", async ({ page }, testInfo) => {
    const { seniorCoordinatorPassword, seniorCoordinatorRole } = testEnv();
    const loginPage = await navigateAndOpenStaffLogin(page);
    await assertStaffLoginPageContent(loginPage);
    await fillAndSubmitStaffLoginForm(
      loginPage,
      apiEnv().xCaseToken,
      seniorCoordinatorRole,
      seniorCoordinatorPassword
    );
    await expect(page).not.toHaveURL(/login/);

    await clickMenuItem(page, "Reports");

    const reportPage = new ReportPage(page);
    await reportPage.assertPageContent();

    const download = await reportPage.exportCsv();
    await reportPage.assertCsvDownload(download);

    const csvPath = await download.path();
    await testInfo.attach(download.suggestedFilename(), { path: csvPath!, contentType: "text/csv" });
    const csvContent = await readFile(csvPath!, "utf8");
    expect(csvContent.length).toBeGreaterThan(0);

    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach("report-export", { body: screenshot, contentType: "image/png" });
  });
});
