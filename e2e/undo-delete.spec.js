import { expect, test } from "@playwright/test";

const labels = (page) => page.locator(".todo-list li label");
const item = (page, name) => page.locator(".todo-list li", { hasText: name });

async function add(page, ...names) {
  for (const name of names) {
    await page.locator(".new-todo").fill(name);
    await page.locator(".new-todo").press("Enter");
  }
}

// The destroy button is hidden until hover.
async function remove(page, name) {
  await item(page, name).hover();
  await item(page, name).locator(".destroy").click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("undo restores a deleted todo at its position with its completed state", async ({ page }) => {
  await add(page, "A", "B", "C");
  await item(page, "B").locator(".toggle").check();
  await remove(page, "B");
  await expect(page.locator(".undo")).toContainText('Deleted "B"');
  await expect(labels(page)).toHaveText(["C", "A"]);

  await page.locator(".undo-button").click();

  await expect(labels(page)).toHaveText(["C", "B", "A"]);
  await expect(item(page, "B")).toHaveClass(/completed/);
});

test("clear completed is undone in one step", async ({ page }) => {
  await add(page, "A", "B", "C");
  await item(page, "A").locator(".toggle").check();
  await item(page, "C").locator(".toggle").check();
  await page.locator(".clear-completed").click();
  await expect(page.locator(".undo")).toContainText("Deleted 2 todos");
  await expect(labels(page)).toHaveText(["B"]);

  await page.locator(".undo-button").click();

  await expect(labels(page)).toHaveText(["C", "B", "A"]);
  await expect(page.locator(".undo")).toBeHidden();
});

test("Control+Z and Meta+Z undo a delete when focus is not in a text input", async ({ page }) => {
  await add(page, "A", "B", "C");
  await remove(page, "A");
  await remove(page, "B");
  await expect(page.locator(".undo")).toBeVisible();

  // Inside the new-todo input the shortcut keeps native text undo.
  await page.locator(".new-todo").press("Control+Z");
  await expect(labels(page)).toHaveText(["C"]);

  await page.locator(".new-todo").blur();
  await page.keyboard.press("Control+Z");
  await expect(labels(page)).toHaveText(["C", "B"]);
  await page.keyboard.press("Meta+Z");
  await expect(labels(page)).toHaveText(["C", "B", "A"]);
});

test("the Undo button works from the keyboard", async ({ page }) => {
  await add(page, "A");
  await remove(page, "A");
  const button = page.locator(".undo-button");
  await expect(button).toBeVisible();

  await page.locator(".new-todo").focus();
  for (let i = 0; i < 20 && !(await button.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(labels(page)).toHaveText(["A"]);
});

test("multiple deletes undo in reverse order and the region hides when empty", async ({ page }) => {
  await add(page, "A", "B");
  await remove(page, "A");
  await remove(page, "B");
  await expect(page.locator(".undo")).toContainText('Deleted "B"');

  await page.locator(".undo-button").click();
  await expect(labels(page)).toHaveText(["B"]);
  await expect(page.locator(".undo")).toContainText('Deleted "A"');

  await page.locator(".undo-button").click();
  await expect(labels(page)).toHaveText(["B", "A"]);
  await expect(page.locator(".undo")).toBeHidden();
});

test("a restored todo survives a reload", async ({ page }) => {
  await add(page, "A", "B");
  await remove(page, "A");
  await page.locator(".undo-button").click();
  await expect(labels(page)).toHaveText(["B", "A"]);

  await page.reload();

  await expect(labels(page)).toHaveText(["B", "A"]);
});

test("the undo stack does not survive a reload", async ({ page }) => {
  await add(page, "A", "B");
  await remove(page, "A");
  await expect(page.locator(".undo")).toBeVisible();

  await page.reload();

  await expect(labels(page)).toHaveText(["B"]);
  await expect(page.locator(".undo")).toBeHidden();
});
