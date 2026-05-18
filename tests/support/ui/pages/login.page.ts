import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async navigateToHome(): Promise<void> {
    await this.page.goto("/");
  }

  async clickStaffLogin(): Promise<void> {
    await this.page.getByRole("link", { name: "Staff login" }).click();
  }

  get staffLoginHeading() {
    return this.page.getByRole("heading", { level: 2, name: "Staff Login" });
  }

  get staffLoginSubtitle() {
    return this.page.locator("p", { hasText: "Authenticate with your role credentials." });
  }

  async fillCaseToken(token: string): Promise<void> {
    await this.page.locator("#case-token-input").fill(token);
  }

  async selectRole(roleId: string): Promise<void> {
    await this.page.locator("#role-select").selectOption(roleId);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.locator("#password-input").fill(password);
  }

  async submit(): Promise<void> {
    await this.page.locator("[type=submit]").click();
  }
}
