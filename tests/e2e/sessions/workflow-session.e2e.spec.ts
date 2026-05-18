import { test, expect } from "@playwright/test";

import {
  assertStaffLoginPageContent,
  fillAndSubmitStaffLoginForm,
  navigateAndOpenStaffLogin
} from "@support/ui/common.steps.js";
import { clickMenuItem } from "@support/ui/pages/sidebar-menu.js";
import { SessionPage } from "@support/ui/pages/session.page.js";
import { apiEnv, testEnv } from "@support/config/env.js";
import { createSessionResponseSchema } from "@support/api/session/session.schemas.js";

test.describe("Session Workflow E2E", () => {
  test("should create a new session", async ({ page }, testInfo) => {
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

    await clickMenuItem(page, "Sessions");

    const sessionPage = new SessionPage(page);
    await sessionPage.assertSessionsHeading();

    await sessionPage.clickNewSession();
    await sessionPage.assertWizardSteps();

    const sessionApiResponse = page.waitForResponse(
      (response) => {
        const url = new URL(response.url());

        return url.pathname.endsWith("/api/admin/sessions") && response.request().method() === "POST";
      }
    );

    await sessionPage.completeSession();

    const response = await sessionApiResponse;
    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    const createdSession = createSessionResponseSchema.parse(responseBody);
    expect(createdSession.state).toBe("pending-approval");

    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach("session-created", { body: screenshot, contentType: "image/png" });
  });
});
