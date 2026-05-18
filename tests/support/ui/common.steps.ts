import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { LoginPage } from "@support/ui/pages/login.page.js";

export async function navigateAndOpenStaffLogin(page: Page): Promise<LoginPage> {
  const loginPage = new LoginPage(page);

  await loginPage.navigateToHome();
  await loginPage.clickStaffLogin();

  return loginPage;
}

export async function assertStaffLoginPageContent(loginPage: LoginPage): Promise<void> {
  await expect(loginPage.staffLoginHeading).toBeVisible();
  await expect(loginPage.staffLoginSubtitle).toBeVisible();
}

export async function fillAndSubmitStaffLoginForm(
  loginPage: LoginPage,
  caseToken: string,
  roleId: string,
  password: string
): Promise<void> {
  await loginPage.fillCaseToken(caseToken);
  await loginPage.selectRole(roleId);
  await loginPage.fillPassword(password);
  await loginPage.submit();
}
