import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const SESSION_STEPS = ["Subject", "Chamber", "Apparatus", "Schedule", "Review"] as const;

function defaultScheduleDate(): string {
  const date = new Date();
  const currentYear = date.getFullYear();
  const decemberFirstAtNine = new Date(currentYear, 11, 1, 9, 0, 0, 0);
  const nextAvailableDate =
    date < decemberFirstAtNine ? decemberFirstAtNine : new Date(currentYear + 1, 11, 1, 9, 0, 0, 0);

  return `${nextAvailableDate.getFullYear()}-12-01T09:00`;
}

export class SessionPage {
  constructor(private readonly page: Page) {}

  async assertSessionsHeading(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { level: 2, name: "Test sessions" })
    ).toBeVisible();
  }

  async clickNewSession(): Promise<void> {
    await this.page.getByRole("button", { name: "New session" }).click();
  }

  async assertWizardSteps(): Promise<void> {
    for (const step of SESSION_STEPS) {
      await expect(this.page.getByRole("listitem").filter({ hasText: step })).toBeVisible();
    }
  }

  private async clickNext(): Promise<void> {
    await this.page.getByRole("button", { name: "Next" }).click();
  }

  private async clickScheduleSession(): Promise<void> {
    await this.page.getByRole("button", { name: "Schedule session" }).click();
  }

  private async selectFirstOptionAndNext(): Promise<void> {
    const select = this.page.locator("select");
    await select.selectOption({ index: 1 });
    await this.clickNext();
  }

  private async fillScheduleAndNext(datetime = defaultScheduleDate()): Promise<void> {
    await this.page.locator("input[type='datetime-local']").fill(datetime);
    await this.clickNext();
  }

  async assertReviewSummary(): Promise<void> {
    const summary = this.page.locator("div.font-modern-mono");
    await expect(summary).toBeVisible();
    await expect(summary.locator("p", { hasText: "Subject:" })).toBeVisible();
    await expect(summary.locator("p", { hasText: "Chamber:" })).toBeVisible();
    await expect(summary.locator("p", { hasText: "Apparatus:" })).toBeVisible();
    await expect(summary.locator("p", { hasText: "Scheduled:" })).toBeVisible();
  }

  async completeSession(): Promise<void> {
    // Subject
    await this.selectFirstOptionAndNext();

    // Chamber
    await this.selectFirstOptionAndNext();

    // Apparatus
    await this.selectFirstOptionAndNext();

    // Schedule
    await this.fillScheduleAndNext();

    // Review — assert summary then confirm
    await this.assertReviewSummary();
    await this.clickScheduleSession();
  }
}
