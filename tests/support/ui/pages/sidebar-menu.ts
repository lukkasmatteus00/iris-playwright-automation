import type { Page } from "@playwright/test";

export class SidebarMenu {
  private readonly nav;

  constructor(private readonly page: Page) {
    this.nav = page.getByRole("navigation");
  }

  async clickMenuItem(itemName: string): Promise<void> {
    await this.nav.getByRole("link", { name: itemName, exact: true }).click();
  }
}

export async function clickMenuItem(page: Page, itemName: string): Promise<void> {
  await new SidebarMenu(page).clickMenuItem(itemName);
}
