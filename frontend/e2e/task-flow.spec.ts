import { expect, test } from "@playwright/test";

test("register, manage, and delete a task, then log out and back in", async ({ page }) => {
  page.on("pageerror", (error) => console.error("Browser page error:", error));
  const email = `e2e-${Date.now()}@example.test`;
  const password = "e2e-safe-password-123";
  const initialTitle = "Prepare internship portfolio";
  const editedTitle = "Publish internship portfolio";

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Portfolio Tester");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Good to see you" })).toBeVisible();

  await page.getByRole("link", { name: "Open task board" }).click();
  await page.getByRole("button", { name: "New task" }).click();
  await page.getByLabel("Title").fill(initialTitle);
  await page.getByLabel("Description").fill("Finish the work samples and review the README.");
  await page.getByRole("dialog").getByLabel("Priority").selectOption("HIGH");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByRole("link", { name: initialTitle })).toBeVisible();

  await page.getByRole("button", { name: `Edit ${initialTitle}` }).click();
  await page.getByLabel("Title").fill(editedTitle);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("link", { name: editedTitle })).toBeVisible();

  const dragHandle = page.getByRole("button", {
    name: `Drag ${editedTitle} to change status`,
  });
  const targetColumn = page.getByRole("region", { name: "In progress tasks" });
  const from = await dragHandle.boundingBox();
  const to = await targetColumn.boundingBox();
  if (!from || !to) {
    throw new Error("Could not locate the task drag handle or destination column.");
  }
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 12 });
  await page.mouse.up();
  await expect(
    targetColumn.getByRole("link", { name: editedTitle }),
  ).toBeVisible();

  await page.getByRole("button", { name: `Delete ${editedTitle}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete task" }).click();
  await expect(page.getByRole("link", { name: editedTitle })).toHaveCount(0);

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Good to see you" })).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();
});
